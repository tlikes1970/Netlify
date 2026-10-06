import {
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
} from "firebase/auth";
import { auth } from "./firebaseBootstrap";
import { isCapacitorNative } from "./capacitorEnv";

export async function reauthenticateForDeletion(
  password?: string,
): Promise<void> {
  const user = auth.currentUser;
  if (!user)
    throw Object.assign(new Error("authentication-required"), {
      code: "authentication-required",
    });
  if (
    user.providerData.some((provider) => provider.providerId === "password")
  ) {
    if (!password || !user.email)
      throw Object.assign(new Error("password-required"), {
        code: "password-required",
      });
    await reauthenticateWithCredential(
      user,
      EmailAuthProvider.credential(user.email, password),
    );
  } else if (
    user.providerData.some((provider) => provider.providerId === "google.com")
  ) {
    if (isCapacitorNative()) {
      const { reauthenticateWithGoogleNative } = await import(
        "./googleAuthNative"
      );
      await reauthenticateWithGoogleNative(user);
    } else await reauthenticateWithPopup(user, new GoogleAuthProvider());
  } else if (
    user.providerData.some((provider) => provider.providerId === "apple.com")
  ) {
    await reauthenticateWithPopup(user, new OAuthProvider("apple.com"));
  } else
    throw Object.assign(new Error("reauthentication-unavailable"), {
      code: "reauthentication-unavailable",
    });
  if (auth.currentUser?.uid !== user.uid)
    throw Object.assign(new Error("account-changed"), {
      code: "account-changed",
    });
}
