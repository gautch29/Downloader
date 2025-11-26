import Vapor
import Fluent
import Foundation

actor DownloadManager {
    let app: Application
    let downloadDir: String

    init(app: Application) {
        self.app = app
        self.downloadDir = Environment.get("DOWNLOAD_DIR") ?? app.directory.workingDirectory + "../downloads"
        
        // Ensure download directory exists
        try? FileManager.default.createDirectory(atPath: downloadDir, withIntermediateDirectories: true)
        
        Task {
            await self.startWorker()
        }
    }

    func startWorker() async {
        app.logger.info("Starting Download Worker...")
        while true {
            do {
                try await processQueue()
            } catch {
                app.logger.error("Worker error: \(error)")
            }
            // Sleep for 5 seconds
            try? await Task.sleep(nanoseconds: 5 * 1_000_000_000)
        }
    }

    func processQueue() async throws {
        // Find pending download
        guard let download = try await Download.query(on: app.db)
            .filter(\.$status == .pending)
            .first() else {
            return
        }

        app.logger.info("Starting download: \(download.url)")

        // Update status to downloading
        download.status = .downloading
        download.updatedAt = Date()
        try await download.save(on: app.db)

        do {
            // 1. Get direct link (Mocking 1fichier logic for now, will implement ScraperService later)
            // For now, assume URL is direct or handle simple cases
            let directLink = download.url // Placeholder: Needs ScraperService integration

            // 2. Start download
            try await downloadFile(download: download, from: directLink)

            // 3. Mark completed
            download.status = .completed
            download.progress = 100
            download.updatedAt = Date()
            try await download.save(on: app.db)
            
            app.logger.info("Download completed: \(download.filename ?? "unknown")")
            
            // Trigger Plex Scan
            let plexService = PlexService(client: app.client, db: app.db)
            await plexService.scanLibrary()

        } catch {
            app.logger.error("Download failed: \(error)")
            download.status = .error
            download.error = "\(error)"
            download.updatedAt = Date()
            try await download.save(on: app.db)
        }
    }

    func downloadFile(download: Download, from urlString: String) async throws {
        guard let url = URL(string: urlString) else {
            throw Abort(.badRequest, reason: "Invalid URL")
        }

        let (asyncBytes, response) = try await URLSession.shared.bytes(from: url)
        
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw Abort(.badRequest, reason: "Server returned error")
        }

        let totalBytes = httpResponse.expectedContentLength
        var downloadedBytes: Int64 = 0
        
        // Determine filename
        let filename = download.customFilename ?? httpResponse.suggestedFilename ?? "file-\(download.id ?? 0)"
        download.filename = filename
        try await download.save(on: app.db)

        let filePath = URL(fileURLWithPath: downloadDir).appendingPathComponent(filename)
        
        // Create file
        FileManager.default.createFile(atPath: filePath.path, contents: nil, attributes: nil)
        let handle = try FileHandle(forWritingTo: filePath)
        defer { try? handle.close() }

        var lastUpdate = Date()
        
        for try await byte in asyncBytes {
            handle.write(Data([byte]))
            downloadedBytes += 1
            
            let now = Date()
            if now.timeIntervalSince(lastUpdate) > 1.0 {
                let progress = totalBytes > 0 ? Int((Double(downloadedBytes) / Double(totalBytes)) * 100) : 0
                
                // Update DB in a separate task to not block download loop too much
                // Note: In a real actor, we might want to be careful about re-entrancy, 
                // but for simple progress updates it's okay to fire and forget or await briefly.
                // Here we just update the local model and save periodically.
                download.progress = progress
                download.size = totalBytes
                try await download.save(on: app.db)
                
                lastUpdate = now
            }
        }
    }
}
