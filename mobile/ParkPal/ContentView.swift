//
//  ContentView.swift
//  ParkPal
//
//  Created by Samuel Buena on 10/12/24.
//

import SwiftUI

struct ContentView: View {
    
    @StateObject private var locationManager = LocationManager()
    @State var isLoggedIn: Bool = false
    @State var wantsToRegister: Bool = false
    
    @State private var isActive: Bool = false
    
    init() {
        UITabBar.appearance().backgroundColor = UIColor.systemGray6.withAlphaComponent(1.0)
    }
    
    var body: some View {
        ZStack {
            if self.isActive {
                if isLoggedIn {
                    TabView {
                        ParkingSelectView(userLocation: $locationManager.userLocation)
                            .tabItem {
                                Label("Parking", systemImage: "parkingsign.circle")
                            }
                        AboutView()
                            .tabItem {
                                Label("About", systemImage: "info.circle")
                            }
                        ProfileView()
                            .tabItem {
                                Label("Profile", systemImage: "person.circle")
                            }
                    }
                } else {
                    if wantsToRegister {
                        SignUpView() { wantsToRegister = !wantsToRegister }
                    } else {
                        LoginView() { wantsToRegister = !wantsToRegister }
                    }
                    Spacer()
                }
            } else {
                Rectangle()
                    .background(Color.black)
                Image("SplashScreen")
                    .resizable()
                    .scaledToFill()
            }
        }.onAppear {
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                withAnimation {
                    self.isActive = true
                }
            }
        }
    }
}

#Preview {
    ContentView()
}
