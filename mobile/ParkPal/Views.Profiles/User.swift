//
//  User.swift
//  ParkPal
//
//  Created by Samuel Buena on 10/12/24.
//

import Foundation

class UserManager: ObservableObject {
    @Published var user: User?
}

struct User {
    let id: String
    let username: String
    let email: String
    let rating: Int
    let level: Int
    let settings: Settings
}

struct Settings {
    let emailNotifications: Bool
    let showAccessibility: Bool
}
