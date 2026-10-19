package ir.nightcast.app;

import android.app.Activity;

import androidx.core.content.ContextCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.exceptions.GetCredentialCancellationException;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.credentials.exceptions.NoCredentialException;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;

@CapacitorPlugin(name = "NightCastGoogleAuth")
public class NightCastGoogleAuth extends Plugin {

    private static final String WEB_CLIENT_ID =
            "242292157493-km4c11qgkf0lr3e6pv9paspkn95jbf3a.apps.googleusercontent.com";

    private CredentialManager credentialManager;

    private boolean signInInProgress = false;


    @Override
    public void load() {
        super.load();

        credentialManager =
                CredentialManager.create(getContext());
    }


    @PluginMethod
    public void signIn(PluginCall call) {

        Activity activity = getActivity();

        if (activity == null) {
            call.reject(
                    "Android Activity is not available."
            );
            return;
        }

        if (signInInProgress) {
            call.reject(
                    "Google sign-in is already in progress."
            );
            return;
        }

        signInInProgress = true;


        final GetSignInWithGoogleOption googleOption;

        try {

            googleOption =
                    new GetSignInWithGoogleOption.Builder(
                            WEB_CLIENT_ID
                    ).build();

        } catch (Exception e) {

            signInInProgress = false;

            call.reject(
                    "Unable to initialize Google sign-in."
            );

            return;
        }


        final GetCredentialRequest request =
                new GetCredentialRequest.Builder()
                        .addCredentialOption(googleOption)
                        .build();


        credentialManager.getCredentialAsync(
                activity,
                request,
                null,
                ContextCompat.getMainExecutor(activity),
                new CredentialManagerCallback<
                        GetCredentialResponse,
                        GetCredentialException>() {

                    @Override
                    public void onResult(
                            GetCredentialResponse result
                    ) {

                        signInInProgress = false;

                        handleCredential(
                                call,
                                result
                        );
                    }


                    @Override
                    public void onError(
                            GetCredentialException error
                    ) {

                        signInInProgress = false;


                        if (error instanceof
                                GetCredentialCancellationException) {

                            call.reject(
                                    "Google sign-in was cancelled."
                            );

                            return;
                        }


                        if (error instanceof
                                NoCredentialException) {

                            call.reject(
                                    "No Google credential is available on this device."
                            );

                            return;
                        }


                        String message =
                                error.getMessage();

                        if (message == null ||
                                message.trim().isEmpty()) {

                            message =
                                    "Unknown Google sign-in error.";
                        }


                        call.reject(
                                "Google sign-in failed: "
                                        + message
                        );
                    }
                }
        );
    }


    private void handleCredential(
            PluginCall call,
            GetCredentialResponse result
    ) {

        try {

            Credential credential =
                    result.getCredential();


            if (!(credential instanceof CustomCredential)) {

                call.reject(
                        "Google did not return a Google ID credential."
                );

                return;
            }


            CustomCredential customCredential =
                    (CustomCredential) credential;


            if (!GoogleIdTokenCredential
                    .TYPE_GOOGLE_ID_TOKEN_CREDENTIAL
                    .equals(customCredential.getType())) {

                call.reject(
                        "Unsupported Google credential type."
                );

                return;
            }


            GoogleIdTokenCredential googleCredential =
                    GoogleIdTokenCredential.createFrom(
                            customCredential.getData()
                    );


            String idToken =
                    googleCredential.getIdToken();


            if (idToken == null ||
                    idToken.isEmpty()) {

                call.reject(
                        "Google did not return an ID token."
                );

                return;
            }


            JSObject response =
                    new JSObject();

            response.put(
                    "idToken",
                    idToken
            );


            call.resolve(response);


        } catch (Exception e) {

            call.reject(
                    "Google credential processing failed."
            );
        }
    }
}
