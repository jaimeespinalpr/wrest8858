import SwiftUI

struct ContentView: View {
    @StateObject private var model = WebViewModel()

    var body: some View {
        GeometryReader { proxy in
            ZStack {
                LinearGradient(
                    colors: [Color(red: 0.06, green: 0.11, blue: 0.18), Color(red: 0.18, green: 0.11, blue: 0.06)],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .ignoresSafeArea()

                Wrest8858WebView(model: model)
                    .clipShape(RoundedRectangle(cornerRadius: adaptiveCornerRadius(for: proxy.size), style: .continuous))
                    .overlay(alignment: .top) {
                        if model.isLoading {
                            ProgressView()
                                .padding(.top, 14)
                        }
                    }
                    .padding(.horizontal, 6)
                    .padding(.top, 6)
                    .padding(.bottom, 2)
            }
            .safeAreaInset(edge: .bottom) {
                controlsBar
                    .padding(.top, 8)
                    .padding(.bottom, 2)
            }
            .overlay(alignment: .top) {
                if let errorMessage = model.errorMessage {
                    Text(errorMessage)
                        .font(.footnote.weight(.semibold))
                        .foregroundStyle(.white)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 14)
                        .padding(.vertical, 10)
                        .background(.red.opacity(0.85), in: Capsule())
                        .padding(.top, 12)
                        .transition(.move(edge: .top).combined(with: .opacity))
                }
            }
        }
        .animation(.spring(response: 0.32, dampingFraction: 0.85), value: model.errorMessage)
    }

    private func adaptiveCornerRadius(for size: CGSize) -> CGFloat {
        max(12, min(size.width, size.height) * 0.028)
    }

    private var controlsBar: some View {
        HStack(spacing: 16) {
            Button {
                model.goBack()
            } label: {
                Label("Atrás", systemImage: "chevron.backward")
                    .labelStyle(.iconOnly)
            }
            .disabled(!model.canGoBack)

            Button {
                model.reloadWithFeedback()
            } label: {
                Label("Recargar", systemImage: "arrow.clockwise")
                    .labelStyle(.iconOnly)
            }

            Button {
                model.goForward()
            } label: {
                Label("Adelante", systemImage: "chevron.forward")
                    .labelStyle(.iconOnly)
            }
            .disabled(!model.canGoForward)
        }
        .font(.title3.weight(.semibold))
        .padding(.horizontal, 18)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial, in: Capsule())
        .overlay {
            Capsule()
                .stroke(Color.white.opacity(0.22), lineWidth: 1)
        }
        .tint(.white)
        .foregroundStyle(.white)
        .padding(.horizontal, 12)
    }
}
