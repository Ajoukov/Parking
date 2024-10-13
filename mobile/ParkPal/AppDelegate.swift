import UIKit
import GoogleMaps

class AppDelegate: UIResponder, UIApplicationDelegate {
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        GMSServices.provideAPIKey("AIzaSyDbEzHIOlS1IRVmtFVIK6bqLspnnwt1xeM")
        print("provided api key")
        return true
    }
}

