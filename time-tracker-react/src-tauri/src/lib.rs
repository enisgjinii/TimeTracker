use std::collections::HashMap;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct WindowInfo {
    pub id: String,
    pub title: String,
    pub app_name: String,
    pub process_id: u32,
    pub is_active: bool,
}

#[derive(serde::Serialize, serde::Deserialize, Clone)]
pub struct ProcessInfo {
    pub id: u32,
    pub name: String,
    pub path: Option<String>,
    pub cpu_usage: f64,
    pub memory_usage: u64,
}

#[tauri::command]
fn get_active_window() -> Result<WindowInfo, String> {
    #[cfg(target_os = "macos")]
    {
        // On macOS, use system_profiler or other tools to get active window
        match get_macos_active_window() {
            Ok(window) => Ok(window),
            Err(e) => Err(format!("Failed to get active window: {}", e)),
        }
    }

    #[cfg(target_os = "windows")]
    {
        // On Windows, use Windows API or PowerShell
        match get_windows_active_window() {
            Ok(window) => Ok(window),
            Err(e) => Err(format!("Failed to get active window: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        // On Linux, use xprop or wmctrl
        match get_linux_active_window() {
            Ok(window) => Ok(window),
            Err(e) => Err(format!("Failed to get active window: {}", e)),
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[tauri::command]
fn get_running_processes() -> Result<Vec<ProcessInfo>, String> {
    let mut processes = Vec::new();

    #[cfg(target_os = "macos")]
    {
        // Use ps command on macOS
        match Command::new("ps")
            .args(&["-eo", "pid,ppid,pcpu,pmem,comm"])
            .output()
        {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines().skip(1) { // Skip header
                    if let Some(process) = parse_ps_line(line) {
                        processes.push(process);
                    }
                }
                Ok(processes)
            }
            Err(e) => Err(format!("Failed to get processes: {}", e)),
        }
    }

    #[cfg(target_os = "windows")]
    {
        // Use tasklist on Windows
        match Command::new("tasklist")
            .args(&["/FO", "CSV", "/NH"])
            .output()
        {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines() {
                    if let Some(process) = parse_tasklist_line(line) {
                        processes.push(process);
                    }
                }
                Ok(processes)
            }
            Err(e) => Err(format!("Failed to get processes: {}", e)),
        }
    }

    #[cfg(target_os = "linux")]
    {
        // Use ps on Linux
        match Command::new("ps")
            .args(&["-eo", "pid,ppid,pcpu,pmem,comm"])
            .output()
        {
            Ok(output) => {
                let output_str = String::from_utf8_lossy(&output.stdout);
                for line in output_str.lines().skip(1) {
                    if let Some(process) = parse_ps_line(line) {
                        processes.push(process);
                    }
                }
                Ok(processes)
            }
            Err(e) => Err(format!("Failed to get processes: {}", e)),
        }
    }

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    {
        Err("Unsupported platform".to_string())
    }
}

#[cfg(target_os = "macos")]
fn get_macos_active_window() -> Result<WindowInfo, String> {
    // Use AppleScript to get active window information
    let script = r#"
        tell application "System Events"
            set frontApp to name of first application process whose frontmost is true
            tell process frontApp
                set windowTitle to name of front window
                return {frontApp, windowTitle}
            end tell
        end tell
    "#;

    match Command::new("osascript")
        .arg("-e")
        .arg(script)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let parts: Vec<&str> = output_str.split(", ").collect();

            if parts.len() >= 2 {
                Ok(WindowInfo {
                    id: format!("macos-{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()),
                    title: parts[1].to_string(),
                    app_name: parts[0].to_string(),
                    process_id: 0, // We'll get this from process list
                    is_active: true,
                })
            } else {
                Err("Could not parse window information".to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute AppleScript: {}", e)),
    }
}

#[cfg(target_os = "windows")]
fn get_windows_active_window() -> Result<WindowInfo, String> {
    // Use PowerShell to get active window
    let script = r#"
        Add-Type @"
            using System;
            using System.Runtime.InteropServices;
            public class User32 {
                [DllImport("user32.dll")]
                public static extern IntPtr GetForegroundWindow();
                [DllImport("user32.dll")]
                public static extern int GetWindowText(IntPtr hWnd, string lpString, int nMaxCount);
                [DllImport("user32.dll", SetLastError = true)]
                public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
            }
"@

        $hwnd = [User32]::GetForegroundWindow()
        $title = New-Object -TypeName "System.Text.StringBuilder" -ArgumentList 256
        [User32]::GetWindowText($hwnd, $title, 256) | Out-Null
        $titleStr = $title.ToString()

        $processId = 0
        [User32]::GetWindowThreadProcessId($hwnd, [ref]$processId) | Out-Null

        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
        $processName = if ($process) { $process.ProcessName } else { "Unknown" }

        Write-Output "$processName|$titleStr|$processId"
    "#;

    match Command::new("powershell")
        .arg("-Command")
        .arg(script)
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout).trim().to_string();
            let parts: Vec<&str> = output_str.split('|').collect();

            if parts.len() >= 3 {
                Ok(WindowInfo {
                    id: format!("windows-{}", SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_millis()),
                    title: parts[1].to_string(),
                    app_name: parts[0].to_string(),
                    process_id: parts[2].parse().unwrap_or(0),
                    is_active: true,
                })
            } else {
                Err("Could not parse window information".to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute PowerShell: {}", e)),
    }
}

#[cfg(target_os = "linux")]
fn get_linux_active_window() -> Result<WindowInfo, String> {
    // Use xprop to get active window information
    match Command::new("xprop")
        .args(&["-root", "_NET_ACTIVE_WINDOW"])
        .output()
    {
        Ok(output) => {
            let output_str = String::from_utf8_lossy(&output.stdout);
            let window_id = output_str
                .lines()
                .find(|line| line.contains("_NET_ACTIVE_WINDOW"))
                .and_then(|line| line.split_whitespace().last())
                .unwrap_or("0x0");

            if window_id != "0x0" {
                // Get window title
                match Command::new("xprop")
                    .args(&["-id", window_id, "WM_NAME"])
                    .output()
                {
                    Ok(title_output) => {
                        let title_str = String::from_utf8_lossy(&title_output.stdout);
                        let title = title_str
                            .split('"')
                            .nth(1)
                            .unwrap_or("Unknown Window")
                            .to_string();

                        Ok(WindowInfo {
                            id: format!("linux-{}", window_id),
                            title,
                            app_name: "Unknown".to_string(), // Could be enhanced
                            process_id: 0,
                            is_active: true,
                        })
                    }
                    Err(_) => Err("Could not get window title".to_string()),
                }
            } else {
                Err("No active window found".to_string())
            }
        }
        Err(e) => Err(format!("Failed to execute xprop: {}", e)),
    }
}

fn parse_ps_line(line: &str) -> Option<ProcessInfo> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 5 {
        Some(ProcessInfo {
            id: parts[0].parse().unwrap_or(0),
            name: parts[4].to_string(),
            path: None,
            cpu_usage: parts[2].parse().unwrap_or(0.0),
            memory_usage: (parts[3].parse::<f64>().unwrap_or(0.0) * 1024.0) as u64, // Convert % to KB
        })
    } else {
        None
    }
}

fn parse_tasklist_line(line: &str) -> Option<ProcessInfo> {
    let parts: Vec<&str> = line.split(',').collect();
    if parts.len() >= 6 {
        // Remove quotes from process name
        let name = parts[0].trim_matches('"').to_string();
        Some(ProcessInfo {
            id: parts[1].parse().unwrap_or(0),
            name,
            path: None,
            cpu_usage: 0.0, // Tasklist doesn't provide CPU usage
            memory_usage: 0, // Tasklist doesn't provide memory usage in a simple way
        })
    } else {
        None
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            get_active_window,
            get_running_processes
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
