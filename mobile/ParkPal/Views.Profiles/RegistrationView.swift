import SwiftUI
import AVFoundation

struct SignUpView: View {
    @State private var username: String = ""
    @State private var email: String = ""
    @State private var password: String = ""
    @State private var signUpSuccess: Bool = false
    @State private var alertActive: Bool = false
    @State private var errorMessage: String = ""

    @EnvironmentObject var user: UserManager
    @Environment(\.presentationMode) var presentationMode

    var toggleLoginRegister: () -> Void = {}

    private let apiURL = "http://localhost:\(Bundle.main.infoDictionary?["REACT_APP_BPORT"] as? String ?? "5001")/api/signup"

    var body: some View {
        VStack {
            HStack {
                Text("Sign Up")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.bottom, 40)
                Text("to Parkara")
                    .font(.largeTitle)
                    .padding(.bottom, 40)
                Spacer()
            }

            TextField("Username", text: $username)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.bottom, 20)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .shadow(radius: 2)

            TextField("Email", text: $email)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.bottom, 20)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .shadow(radius: 2)

            SecureField("Password", text: $password)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(10)
                .padding(.bottom, 40)
                .shadow(radius: 2)

            Button(action: {
                signUp()
            }) {
                Text("Sign Up")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            .padding(.horizontal)

            Spacer()

            Button(action: toggleLoginRegister) {
                Text("Already have an account?")
                    .foregroundColor(.blue)
            }
        }
        .padding()
        .alert(isPresented: $alertActive) {
            Alert(
                title: Text(signUpSuccess ? "Success" : "Error"),
                message: Text(signUpSuccess ? "Sign Up Successful" : errorMessage),
                dismissButton: .default(Text("OK"))
            )
        }
    }

    private func signUp() {
        guard let url = URL(string: apiURL) else { return }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        // Constructing the body directly using a dictionary.
        let body: [String: Any] = ["username": username, "email": email, "password": password]

        // Encoding the body to JSON data using JSONSerialization.
        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: body)
        } catch {
            DispatchQueue.main.async {
                errorMessage = "Error encoding request: \(error.localizedDescription)"
                alertActive = true
            }
            return
        }

        // Making the network request.
        URLSession.shared.dataTask(with: request) { data, response, error in
            guard let data = data, error == nil else {
                DispatchQueue.main.async {
                    errorMessage = error?.localizedDescription ?? "Error signing up"
                    alertActive = true
                    signUpSuccess = false
                }
                return
            }

            // Directly parsing the JSON response as a dictionary.
            do {
                if let jsonResponse = try JSONSerialization.jsonObject(with: data, options: []) as? [String: Any],
                   let userDict = jsonResponse["user"] as? [String: Any] {
                    DispatchQueue.main.async {
                        // Safely accessing specific fields from the user dictionary
                        user.user = User(
                            id: userDict["_id"] as? String ?? "",
                            username: userDict["username"] as? String ?? "",
                            email: userDict["email"] as? String ?? "",
                            rating: userDict["rating"] as? Int ?? 0,
                            level: userDict["level"] as? Int ?? 0,
                            settings: Settings(
                                emailNotifications: (userDict["settings"] as? [String: Any])?["emailNotifications"] as? Bool ?? false,
                                showAccessibility: (userDict["settings"] as? [String: Any])?["showAccessibility"] as? Bool ?? false
                            )
                        )
                        UserDefaults.standard.set(try? JSONSerialization.data(withJSONObject: user.user), forKey: "user")
                        presentationMode.wrappedValue.dismiss()
                        playSuccessSound()
                        signUpSuccess = true
                        alertActive = false
                    }
                } else {
                    DispatchQueue.main.async {
                        errorMessage = "Sign Up Failed"
                        alertActive = true
                        signUpSuccess = false
                    }
                }
            } catch {
                DispatchQueue.main.async {
                    errorMessage = "Failed to parse response: \(error.localizedDescription)"
                    alertActive = true
                    signUpSuccess = false
                }
            }
        }.resume()
    }

    private func playSuccessSound() {
        let systemSoundID: SystemSoundID = 1016
        AudioServicesPlaySystemSound(systemSoundID)
    }
}

#Preview {
    SignUpView()
}
