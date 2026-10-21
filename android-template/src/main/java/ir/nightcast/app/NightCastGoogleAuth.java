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

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

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


    /**
     * Exchange the Google ID token from Android natively.
     *
     * This deliberately avoids WebView CORS and remote-origin bridge issues:
     * Google authentication and NightCast session creation remain separate steps.
     */
    @PluginMethod
    public void exchangeToken(PluginCall call) {
        String idToken = call.getString("idToken");
        if (idToken == null || idToken.trim().isEmpty()) {
            call.reject("Google ID Token is missing.");
            return;
        }

        final Activity activity = getActivity();
        if (activity == null) {
            call.reject("Android Activity is not available.");
            return;
        }

        Thread worker = new Thread(() -> {
            HttpURLConnection connection = null;
            try {
                URL url = new URL(
                        "https://nightcast-api.tomasgermany2580.workers.dev/api/v1/public/openid/google"
                );
                connection = (HttpURLConnection) url.openConnection();
                connection.setRequestMethod("POST");
                connection.setConnectTimeout(15000);
                connection.setReadTimeout(15000);
                connection.setDoOutput(true);
                connection.setRequestProperty("Content-Type", "application/json; charset=utf-8");
                connection.setRequestProperty("Accept", "application/json");

                JSONObject payload = new JSONObject();
                payload.put("idToken", idToken);
                byte[] body = payload.toString().getBytes(StandardCharsets.UTF_8);
                connection.setFixedLengthStreamingMode(body.length);
                try (OutputStream output = connection.getOutputStream()) {
                    output.write(body);
                }

                int status = connection.getResponseCode();
                InputStream stream = status >= 200 && status < 400
                        ? connection.getInputStream()
                        : connection.getErrorStream();

                StringBuilder text = new StringBuilder();
                if (stream != null) {
                    try (BufferedReader reader = new BufferedReader(
                            new InputStreamReader(stream, StandardCharsets.UTF_8))) {
                        String line;
                        while ((line = reader.readLine()) != null) {
                            text.append(line);
                        }
                    }
                }

                JSONObject json = new JSONObject(text.toString());
                JSObject response = new JSObject();
                response.put("httpStatus", status);
                response.put("success", json.optBoolean("success", false));
                if (json.has("token")) response.put("token", json.opt("token"));
                if (json.has("user")) response.put("user", json.opt("user"));
                if (json.has("message")) response.put("message", json.opt("message"));
                if (status < 200 || status >= 300) {
                    if (!response.has("message")) {
                        response.put("message", "NightCast login service returned HTTP " + status);
                    }
                }

                activity.runOnUiThread(() -> call.resolve(response));
            } catch (Exception error) {
                String message = error.getMessage();
                if (message == null || message.trim().isEmpty()) {
                    message = "Could not contact the NightCast login service.";
                }
                activity.runOnUiThread(() ->
                        call.reject("Could not contact the NightCast login service.")
                );
            } finally {
                if (connection != null) connection.disconnect();
            }
        }, "NightCast-Google-Token-Exchange");
        worker.start();
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
