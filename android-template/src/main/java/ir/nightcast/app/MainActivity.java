package ir.nightcast.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        setRequestedOrientation(
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        );

        registerPlugin(NightCastGoogleAuth.class);
        registerPlugin(NightCastShare.class);
        registerPlugin(NightCastNotifications.class);

        super.onCreate(savedInstanceState);

        View contentView =
                findViewById(android.R.id.content);

        if (contentView != null) {

            ViewCompat.setOnApplyWindowInsetsListener(
                    contentView,
                    (view, windowInsets) -> {

                        Insets systemInsets =
                                windowInsets.getInsets(
                                        WindowInsetsCompat.Type.statusBars()
                                                | WindowInsetsCompat.Type.displayCutout()
                                );

                        view.setPadding(
                                systemInsets.left,
                                systemInsets.top,
                                systemInsets.right,
                                view.getPaddingBottom()
                        );

                        return windowInsets;
                    }
            );

            ViewCompat.requestApplyInsets(contentView);
        }
    }
}
