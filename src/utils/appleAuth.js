import appleAuth, {
  AppleAuthenticationScope
} from '@invertase/react-native-apple-authentication';

const handleAppleAuth = ({ api, signIn, setGeneralError }) => {
  return async () => {
    try {
      // Request login with Apple
      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [
          AppleAuthenticationScope.EMAIL,
          AppleAuthenticationScope.FULL_NAME
        ]
      });

      // Get token
      const { identityToken, nonce, email, fullName } =
        appleAuthRequestResponse;

      // Send data to your backend
      const response = await api.post('/api/auth/apple', {
        identityToken,
        nonce,
        email,
        fullName: fullName
          ? `${fullName.givenName} ${fullName.familyName}`
          : null
      });

      // Sign in user with your auth context
      await signIn(response.token, response.user);

      return { success: true };
    } catch (error) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.log('User canceled Apple Sign in');
        return { success: false, error: 'User canceled sign in' };
      } else {
        const errorMessage = 'Apple Sign in failed: ' + error.message;
        setGeneralError(errorMessage);
        return { success: false, error: errorMessage };
      }
    }
  };
};

export default handleAppleAuth;
