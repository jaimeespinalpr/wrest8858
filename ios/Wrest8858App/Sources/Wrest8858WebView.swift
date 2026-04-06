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
        configuration.userContentController.add(context.coordinator, name: "nativePrint")

        let webView = WKWebView(frame: .zero, configuration: configuration)
        webView.navigationDelegate = context.coordinator
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

    final class Coordinator: NSObject, WKNavigationDelegate, WKScriptMessageHandler {
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
