import SwiftUI

struct ContentView: View {
  var body: some View {
    NavigationView {
      VStack {
        Text("MetaOdds iOS Starter")
          .font(.largeTitle)
          .bold()
          .padding()
        Text("Welcome to your new iOS module in the MetaOdds monorepo.")
          .multilineTextAlignment(.center)
          .padding()
      }
      .navigationTitle("MetaOdds")
    }
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
  }
}
