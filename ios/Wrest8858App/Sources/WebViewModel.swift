import AudioToolbox
import Foundation
import SwiftUI
import UIKit
import WebKit

final class WebViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var canGoBack = false
    @Published var canGoForward = false

    private weak var webView: WKWebView?
    private var initialBaseURLString: String {
        devServerURL(for: "WPL_WEB_BASE_URL", fallback: "https://jaimeespinalpr.github.io/wrest8858/")
    }
    private var syncProbeURLString: String {
        devServerURL(for: "WPL_SYNC_BASE_URL", fallback: initialBaseURLString)
    }
    private var lastKnownViewportSize: CGSize = .zero
    private var lastWebProcessRecoveryAt: Date = .distantPast
    private var isRecoveringWebProcess = false
    private var lastRemoteSignature: String?
    private var lastSyncCheckAt: Date = .distantPast
    private var hasStartedAutomaticSync = false
    private var isSyncCheckInFlight = false
    private var syncTimer: Timer?

    private func devServerURL(for key: String, fallback: String) -> String {
        let value = ProcessInfo.processInfo.environment[key]?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
        return value.isEmpty ? fallback : value
    }

    func attach(_ webView: WKWebView) {
        self.webView = webView
    }

    func loadInitialURLIfNeeded() {
        guard let webView, webView.url == nil, let initialURL else { return }
        let request = URLRequest(url: initialURL, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData, timeoutInterval: 40)
        webView.load(request)
    }

    func updateViewportIfNeeded(for size: CGSize) {
        guard size.width > 0, size.height > 0 else { return }
        let didChangeSize = abs(size.width - lastKnownViewportSize.width) > 1
            || abs(size.height - lastKnownViewportSize.height) > 1
        guard didChangeSize else { return }
        lastKnownViewportSize = size
        enforceResponsiveViewport()
    }

    func reloadWithFeedback() {
        let generator = UIImpactFeedbackGenerator(style: .rigid)
        generator.impactOccurred()
        refreshFromOrigin()
    }

    func recoverAfterWebProcessIssue(reason: String) {
        let now = Date()
        if isRecoveringWebProcess || now.timeIntervalSince(lastWebProcessRecoveryAt) < 2.0 {
            return
        }
        isRecoveringWebProcess = true
        lastWebProcessRecoveryAt = now
        isLoading = true
        errorMessage = reason
        syncNavigationState()

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) { [weak self] in
            guard let self else { return }
            if let webView = self.webView, webView.url != nil {
                webView.reloadFromOrigin()
            } else {
                self.loadInitialURLIfNeeded()
            }
            self.isRecoveringWebProcess = false
        }

        DispatchQueue.main.asyncAfter(deadline: .now() + 2.2) { [weak self] in
            guard let self else { return }
            if self.errorMessage == reason {
                self.errorMessage = nil
            }
        }
    }

    func goBack() {
        webView?.goBack()
        syncNavigationState()
    }

    func goForward() {
        webView?.goForward()
        syncNavigationState()
    }

    func syncNavigationState() {
        canGoBack = webView?.canGoBack ?? false
        canGoForward = webView?.canGoForward ?? false
    }

    func playSuccessFeedback() {
        AudioServicesPlaySystemSound(1104)
    }

    func enforceResponsiveViewport() {
        guard let webView else { return }
        let js = """
        (() => {
          const head = document.head || document.getElementsByTagName('head')[0];
          if (!head) return;
          let viewport = document.querySelector('meta[name="viewport"]');
          if (!viewport) {
            viewport = document.createElement('meta');
            viewport.setAttribute('name', 'viewport');
            head.appendChild(viewport);
          }
          viewport.setAttribute('content', 'width=device-width, initial-scale=1, viewport-fit=cover');
          document.documentElement.style.width = '100%';
          document.documentElement.style.maxWidth = '100%';
          document.documentElement.style.overflowX = 'hidden';
          document.documentElement.style.webkitTextSizeAdjust = '100%';
          if (document.body) {
            document.body.style.width = '100%';
            document.body.style.maxWidth = '100%';
            document.body.style.overflowX = 'hidden';
            document.body.style.webkitTextSizeAdjust = '100%';
          }
        })();
        """
        webView.evaluateJavaScript(js, completionHandler: nil)
    }

    private var initialURL: URL? {
        guard var components = URLComponents(string: initialBaseURLString) else { return nil }
        return freshenedURL(from: &components, includeSyncToken: false)
    }

    private func freshURL(from url: URL, includeSyncToken: Bool) -> URL {
        guard var components = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return url }
        return freshenedURL(from: &components, includeSyncToken: includeSyncToken) ?? url
    }

    private func freshenedURL(from components: inout URLComponents, includeSyncToken: Bool) -> URL? {
        var items = components.queryItems ?? []
        let dayToken = String(Int(Date().timeIntervalSince1970 / 86_400))
        items.removeAll { $0.name == "ios_day" }
        items.append(URLQueryItem(name: "ios_day", value: dayToken))
        items.removeAll { $0.name == "ios_sync" }
        if includeSyncToken {
            items.append(URLQueryItem(name: "ios_sync", value: String(Int(Date().timeIntervalSince1970))))
        }
        components.queryItems = items
        return components.url
    }

    func printFromWeb(html: String, title: String) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let printController = UIPrintInteractionController.shared
            let printInfo = UIPrintInfo(dictionary: nil)
            printInfo.outputType = .general
            printInfo.jobName = title.isEmpty ? "Wrest Plan" : title
            printController.printInfo = printInfo
            printController.showsNumberOfCopies = true

            if !html.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                let formatter = UIMarkupTextPrintFormatter(markupText: html)
                printController.printFormatter = formatter
            } else if let formatter = self.webView?.viewPrintFormatter() {
                printController.printFormatter = formatter
            } else {
                return
            }

            guard let topVC = Self.topViewController() else { return }
            if UIDevice.current.userInterfaceIdiom == .pad {
                if let sourceView = topVC.view {
                    printController.present(from: sourceView.bounds, in: sourceView, animated: true, completionHandler: nil)
                    return
                }
            }
            printController.present(animated: true, completionHandler: nil)
        }
    }

    private static func topViewController(base: UIViewController? = nil) -> UIViewController? {
        let baseVC: UIViewController? = {
            if let base { return base }
            let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
            let foregroundScenes = scenes.filter { $0.activationState == .foregroundActive }
            let allWindows = (foregroundScenes.isEmpty ? scenes : foregroundScenes).flatMap(\.windows)
            let preferredWindow = allWindows.first(where: { $0.isKeyWindow })
                ?? allWindows.first(where: { !$0.isHidden && $0.alpha > 0 })
                ?? allWindows.first
            return preferredWindow?.rootViewController
        }()
        if let nav = baseVC as? UINavigationController {
            return topViewController(base: nav.visibleViewController)
        }
        if let tab = baseVC as? UITabBarController {
            return topViewController(base: tab.selectedViewController)
        }
        if let presented = baseVC?.presentedViewController {
            return topViewController(base: presented)
        }
        return baseVC
    }

    func handle(error: Error) {
        isLoading = false
        syncNavigationState()
        AudioServicesPlaySystemSound(1521)

        let nsError = error as NSError
        guard nsError.code != NSURLErrorCancelled else { return }

        errorMessage = "No se pudo cargar. Revisa conexión y vuelve a intentar."
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.6) { [weak self] in
            self?.errorMessage = nil
        }
    }

    func startAutomaticSyncIfNeeded() {
        guard !hasStartedAutomaticSync else { return }
        hasStartedAutomaticSync = true
        performRemoteSyncCheck(force: true, reloadIfChanged: false)
    }

    func handleScenePhaseChange(_ phase: ScenePhase) {
        switch phase {
        case .active:
            startAutomaticSyncIfNeeded()
            startSyncTimer()
            performRemoteSyncCheck(force: true, reloadIfChanged: true)
        case .inactive, .background:
            stopSyncTimer()
        @unknown default:
            stopSyncTimer()
        }
    }

    private func startSyncTimer() {
        guard syncTimer == nil else { return }
        syncTimer = Timer.scheduledTimer(withTimeInterval: 180, repeats: true) { [weak self] _ in
            self?.performRemoteSyncCheck(force: false, reloadIfChanged: true)
        }
        if let syncTimer {
            RunLoop.main.add(syncTimer, forMode: .common)
        }
    }

    private func stopSyncTimer() {
        syncTimer?.invalidate()
        syncTimer = nil
    }

    private func performRemoteSyncCheck(force: Bool, reloadIfChanged: Bool) {
        let now = Date()
        if !force && now.timeIntervalSince(lastSyncCheckAt) < 45 {
            return
        }
        guard !isSyncCheckInFlight else { return }
        guard let probeURL = URL(string: syncProbeURLString) else { return }

        lastSyncCheckAt = now
        isSyncCheckInFlight = true

        var request = URLRequest(url: probeURL, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData, timeoutInterval: 20)
        request.httpMethod = "HEAD"

        URLSession.shared.dataTask(with: request) { [weak self] _, response, error in
            DispatchQueue.main.async {
                guard let self else { return }
                self.isSyncCheckInFlight = false

                guard error == nil, let httpResponse = response as? HTTPURLResponse else { return }
                guard (200 ..< 400).contains(httpResponse.statusCode) else { return }

                let signature = self.remoteSignature(from: httpResponse)
                guard !signature.isEmpty else { return }

                if self.lastRemoteSignature == nil {
                    self.lastRemoteSignature = signature
                    return
                }

                guard self.lastRemoteSignature != signature else { return }
                self.lastRemoteSignature = signature

                guard reloadIfChanged else { return }
                self.refreshFromOrigin()
            }
        }.resume()
    }

    private func remoteSignature(from response: HTTPURLResponse) -> String {
        let eTag = response.value(forHTTPHeaderField: "ETag") ?? ""
        let lastModified = response.value(forHTTPHeaderField: "Last-Modified") ?? ""
        let contentLength = response.value(forHTTPHeaderField: "Content-Length") ?? ""
        return [eTag, lastModified, contentLength].joined(separator: "|")
    }

    private func refreshFromOrigin() {
        guard let webView else {
            loadInitialURLIfNeeded()
            return
        }
        isLoading = true
        syncNavigationState()
        let activeURL = webView.url.flatMap { currentURL in
            let baseHost = URL(string: initialBaseURLString)?.host
            return currentURL.host == baseHost ? currentURL : nil
        } ?? initialURL

        guard let activeURL else {
            loadInitialURLIfNeeded()
            return
        }

        let refreshedURL = freshURL(from: activeURL, includeSyncToken: true)
        let request = URLRequest(url: refreshedURL, cachePolicy: .reloadIgnoringLocalAndRemoteCacheData, timeoutInterval: 40)
        webView.load(request)
    }
}
