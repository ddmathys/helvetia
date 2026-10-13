import java.util.Properties

plugins {
    id("com.android.application")
}

// Clé de signature locale (android/keystore.properties, jamais commitée).
val keyProps = Properties().apply {
    val f = rootProject.file("keystore.properties")
    if (f.exists()) f.inputStream().use { load(it) }
}

android {
    namespace = "ch.helvetia.atlas"
    compileSdk = 36

    defaultConfig {
        applicationId = "ch.helvetia.atlas"
        minSdk = 24
        targetSdk = 36
        versionCode = 2
        versionName = "1.1"
    }

    signingConfigs {
        create("release") {
            storeFile = rootProject.file(keyProps.getProperty("storeFile", "helvetia.jks"))
            storePassword = keyProps.getProperty("storePassword")
            keyAlias = keyProps.getProperty("keyAlias")
            keyPassword = keyProps.getProperty("keyPassword")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
    }
}

dependencies {
    // Trusted Web Activity : affiche le site dans Chrome en plein écran, sans barre d'adresse.
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.5.0")
}
