import { NavigationProp } from "@react-navigation/native";

export const handleNotificationPress = (navigation: NavigationProp<any>) => {
    navigation.navigate("notifications");
};
