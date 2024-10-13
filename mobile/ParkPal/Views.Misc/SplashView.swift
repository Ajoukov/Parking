//
//  SplashView.swift
//  ParkPal
//
//  Created by Samuel Buena on 10/12/24.
//

import SwiftUI

struct MainView: View {
    var body: some View {
        Text("Hi")
    }
}

struct SplashView: View {
    associatedtype Content : View
    
    @State var isActive: Bool = false
    var mainView: any View
    
    var body: some View {
        ZStack {
            if self.isActive {
                mainView
            } else {
                Rectangle()
                    .background(Color.black)
                Image("SplashScreen")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 300, height: 300)
            }
        }
        .onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation {
                    self.isActive = true
                }
            }
        }
    }
        
}

#Preview {
    SplashView(mainView: Text("Hi"))
}
