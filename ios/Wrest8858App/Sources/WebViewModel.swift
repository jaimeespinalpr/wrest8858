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
    private let initialURL = URL(string: "https://jaimeespinalpr.github.io/wrest8858/")
    private var lastKnownViewportSize: CGSize = .zero

    func attach(_ webView: WKWebView) {
        self.webView = webView
    }

    func loadInitialURLIfNeeded() {
        guard let webView, webView.url == nil, let initialURL else { return }
        let request = URLRequest(url: initialURL, cachePolicy: .reloadRevalidatingCacheData, timeoutInterval: 40)
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
        webView?.reload()
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
}
