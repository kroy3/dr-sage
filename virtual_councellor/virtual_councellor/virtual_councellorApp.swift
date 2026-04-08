//
//  virtual_councellorApp.swift
//  virtual_councellor
//
//  Created by Kushal Raj Roy on 4/1/26.
//

import SwiftUI

@main
struct virtual_councellorApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
