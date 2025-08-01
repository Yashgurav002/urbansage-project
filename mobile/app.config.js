import 'dotenv/config';

export default {
  expo: {
    name: "UrbanSage Mobile",
    slug: "urbansage-mobile",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#3B82F6"
    },
    assetBundlePatterns: ["**/*"],
    scheme: "urbansage",

    ios: {
      runtimeVersion: {
        policy: "appVersion"
      },
      supportsTablet: true,
      infoPlist: {
        NSCameraUsageDescription: "UrbanSage needs camera access to take photos of city issues",
        NSLocationWhenInUseUsageDescription: "UrbanSage needs location access to determine where issues are reported"
      }
    },

    android: {
      runtimeVersion: "1.0.0",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#3B82F6"
      },
      permissions: [
        "CAMERA",
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "RECORD_AUDIO"
      ],
      package: "com.anonymous.urbansagemobile"
    },

    web: {
      favicon: "./assets/favicon.png"
    },

    plugins: [
      [
        "expo-camera",
        {
          cameraPermission: "Allow UrbanSage to access your camera to take photos of city issues"
        }
      ],
      [
        "expo-location",
        {
          locationAlwaysAndWhenInUsePermission: "Allow UrbanSage to use your location to identify where issues are reported."
        }
      ],
      [
        "expo-notifications",
        {
          // icon: "./assets/notification-icon.png",
          color: "#ffffff"
        }
      ],
      "expo-sqlite"
    ],

    updates: {
      url: "https://u.expo.dev/2a196dc7-e9bb-48a8-8ad2-01091d1c253e"
    },

    extra: {
      eas: {
        projectId: "2a196dc7-e9bb-48a8-8ad2-01091d1c253e"
      },
      IMGBB_API_KEY: process.env.EXPO_PUBLIC_IMGBB_API_KEY,
      API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL
    }
  }
};
