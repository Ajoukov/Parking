//
//  MapView.swift
//  ParkPal
//
//  Created by Samuel Buena on 10/12/24.
//

import SwiftUI
import MapKit
import GoogleMaps

struct GoogleMapView: UIViewRepresentable {
    @Binding var userLocation: CLLocationCoordinate2D?
    
    func makeUIView(context: Context) -> GMSMapView {
        let camera = GMSCameraPosition.camera(withLatitude: 37.7749, longitude: -122.4194, zoom: 15.0) // Default location
        let mapView = GMSMapView.map(withFrame: .zero, camera: camera)
        mapView.isMyLocationEnabled = true // Show the user location
        return mapView
    }
    
    func updateUIView(_ mapView: GMSMapView, context: Context) {
        guard let userLocation = userLocation else { return }
        mapView.animate(to: GMSCameraPosition.camera(withLatitude: userLocation.latitude, longitude: userLocation.longitude, zoom: 15.0))
    }
}
