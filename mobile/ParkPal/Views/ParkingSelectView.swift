//
//  ParkingSelectView.swift
//  ParkPal
//
//  Created by Samuel Buena on 10/12/24.
//

import SwiftUI
import GoogleMaps

struct ParkingSelectView: View {
    @State private var searchText = "";
    @Binding var userLocation: CLLocationCoordinate2D?
    
    var body: some View {
        ZStack {
            GoogleMapView(userLocation: $userLocation)
                .ignoresSafeArea(.all)
                .frame(height: .infinity)
            
            VStack {
                HStack {
                    TextField("Search location...", text: $searchText)
                        .padding(10)
                        .background(Color.white.opacity(0.7))
                        .cornerRadius(20)
                        .padding([.leading, .trailing], 16)
                }
                Spacer()
            }
            
            VStack {
                Spacer()
                Button(action: {
                    // TODO add
                }) {
                    Text("I want parking")
                        .frame(width: 200)
                        .padding()
                        .foregroundColor(.white)
                        .background(Color.blue)
                        .cornerRadius(10)
                        .overlay(
                            RoundedRectangle(cornerRadius: 10)
                                .stroke(Color.blue)
                                .frame(width: 200, height: 50))}
                .padding(.vertical, 50)
            }
        }
    }
}
