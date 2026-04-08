import SwiftUI
import UIKit
import WebKit

struct Wrest8858WebView: UIViewRepresentable {
    @ObservedObject var model: WebViewModel

    func makeCoordinator() -> Coordinator {
        Coordinator(model: model)
    }

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.allowsInlineMediaPlayback = true
        configuration.defaultWebpagePreferences.allowsContentJavaScript = true
        configuration.websiteDataStore = .default()
        configuration.preferences.javaScriptCanOpenWindowsAutomatically = true
        configuration.userContentController.add(context.coordinator, name: "nativePrint")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
        webView.uiDelegate = context.coordinator
        webView.scrollView.keyboardDismissMode = .interactive
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear

        model.attach(webView)
        model.loadInitialURLIfNeeded()
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {
        model.updateViewportIfNeeded(for: uiView.bounds.size)
    }

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler, WKUIDelegate {
        private let model: WebViewModel

        init(model: WebViewModel) {
            self.model = model
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            model.isLoading = true
            model.errorMessage = nil
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            model.isLoading = false
            model.syncNavigationState()
            model.enforceResponsiveViewport()
            model.playSuccessFeedback()
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            model.handle(error: error)
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            model.handle(error: error)
        }

        func webViewWebContentProcessDidTerminate(_ webView: WKWebView) {
            model.recoverAfterWebProcessIssue(reason: "La vista web se reinicio. Recargando...")
        }

        func webViewWebContentProcessDidBecomeUnresponsive(_ webView: WKWebView) {
            model.recoverAfterWebProcessIssue(reason: "La vista web se trabo. Recuperando...")
        }

        func webViewWebContentProcessDidBecomeResponsive(_ webView: WKWebView) {
            model.errorMessage = nil
            model.isLoading = false
            model.syncNavigationState()
        }

        func webView(
            _ webView: WKWebView,
            createWebViewWith configuration: WKWebViewConfiguration,
            for navigationAction: WKNavigationAction,
            windowFeatures: WKWindowFeatures
        ) -> WKWebView? {
            guard navigationAction.targetFrame == nil else { return nil }
            webView.load(navigationAction.request)
            return nil
        }

        func webView(
            _ webView: WKWebView,
            runJavaScriptAlertPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping () -> Void
        ) {
            presentAlert(title: frame.request.url?.host, message: message, actions: [
                UIAlertAction(title: "OK", style: .default) { _ in completionHandler() }
            ], fallback: completionHandler)
        }

        func webView(
            _ webView: WKWebView,
            runJavaScriptConfirmPanelWithMessage message: String,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping (Bool) -> Void
        ) {
            presentAlert(title: frame.request.url?.host, message: message, actions: [
                UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(false) },
                UIAlertAction(title: "OK", style: .default) { _ in completionHandler(true) }
            ], fallback: { completionHandler(false) })
        }

        func webView(
            _ webView: WKWebView,
            runJavaScriptTextInputPanelWithPrompt prompt: String,
            defaultText: String?,
            initiatedByFrame frame: WKFrameInfo,
            completionHandler: @escaping (String?) -> Void
        ) {
            guard let topVC = topViewController() else {
                completionHandler(defaultText)
                return
            }
            let alert = UIAlertController(title: frame.request.url?.host, message: prompt, preferredStyle: .alert)
            alert.addTextField { textField in
                textField.text = defaultText
            }
            alert.addAction(UIAlertAction(title: "Cancelar", style: .cancel) { _ in completionHandler(nil) })
            alert.addAction(UIAlertAction(title: "OK", style: .default) { _ in
                completionHandler(alert.textFields?.first?.text)
            })
            topVC.present(alert, animated: true)
        }

        private func presentAlert(
            title: String?,
            message: String,
            actions: [UIAlertAction],
            fallback: @escaping () -> Void
        ) {
            guard let topVC = topViewController() else {
                fallback()
                return
            }
            let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
            actions.forEach(alert.addAction)
            topVC.present(alert, animated: true)
        }

        private func topViewController(base: UIViewController? = nil) -> UIViewController? {
            let baseVC: UIViewController? = {
                if let base { return base }
                let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
                let foregroundScenes = scenes.filter { $0.activationState == .foregroundActive }
                let windows = (foregroundScenes.isEmpty ? scenes : foregroundScenes).flatMap(\.windows)
                let preferredWindow = windows.first(where: { $0.isKeyWindow })
                    ?? windows.first(where: { !$0.isHidden && $0.alpha > 0 })
                    ?? windows.first
                return preferredWindow?.rootViewController
            }()
            if let nav = baseVC as? UINavigationController { return topViewController(base: nav.visibleViewController) }
            if let tab = baseVC as? UITabBarController { return topViewController(base: tab.selectedViewController) }
            if let presented = baseVC?.presentedViewController { return topViewController(base: presented) }
            return baseVC
        }

        func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
            guard message.name == "nativePrint" else { return }
            if let payload = message.body as? [String: Any] {
                let html = String(payload["html"] as? String ?? "")
                let title = String(payload["title"] as? String ?? "")
                model.printFromWeb(html: html, title: title)
                return
            }
            if let html = message.body as? String {
                model.printFromWeb(html: html, title: "")
            }
        }
    }
}
