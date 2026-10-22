package ir.nightcast.app;

import android.content.pm.ActivityInfo;
import android.os.Bundle;
import android.content.Intent;
import android.os.Handler;
import android.os.Looper;
import org.json.JSONObject;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
 public static volatile boolean activityAlive = false;
 public static final String ACTION_WIDGET_PLAY="ir.nightcast.app.WIDGET_PLAY", ACTION_WIDGET_PAUSE="ir.nightcast.app.WIDGET_PAUSE", ACTION_WIDGET_PREVIOUS="ir.nightcast.app.WIDGET_PREVIOUS", ACTION_WIDGET_NEXT="ir.nightcast.app.WIDGET_NEXT";
 private final Handler widgetHandler=new Handler(Looper.getMainLooper()); private String pendingWidgetAction; private int widgetAttempts;

    @Override
    public void onCreate(Bundle savedInstanceState) {

        setRequestedOrientation(
                ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
        );

        registerPlugin(NightCastGoogleAuth.class);
        registerPlugin(NightCastWidgetBridge.class);

        super.onCreate(savedInstanceState);
        activityAlive = true;
        captureWidgetAction(getIntent());

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

 @Override public void onDestroy(){activityAlive=false;widgetHandler.removeCallbacksAndMessages(null);super.onDestroy();}
 @Override protected void onNewIntent(Intent intent){super.onNewIntent(intent);setIntent(intent);captureWidgetAction(intent);}
 private void captureWidgetAction(Intent i){
  if(i==null)return;String a=i.getAction();
  if(ACTION_WIDGET_PLAY.equals(a))pendingWidgetAction="play";else if(ACTION_WIDGET_PAUSE.equals(a))pendingWidgetAction="pause";else if(ACTION_WIDGET_PREVIOUS.equals(a))pendingWidgetAction="previous";else if(ACTION_WIDGET_NEXT.equals(a))pendingWidgetAction="next";else return;
  widgetAttempts=0;widgetHandler.removeCallbacksAndMessages(null);dispatchWidgetAction();
 }
 private void dispatchWidgetAction(){
  if(pendingWidgetAction==null||isFinishing())return;
  if(getBridge()==null||getBridge().getWebView()==null){retryWidgetAction();return;}
  String a=pendingWidgetAction;String js="(function(){var b=window.NightCastPodcastBridge;if(!b||typeof b.handleWidgetAction!=='function')return false;return b.handleWidgetAction("+JSONObject.quote(a)+")===true;})()";
  getBridge().getWebView().evaluateJavascript(js,result->{if("true".equals(result)){pendingWidgetAction=null;Intent clean=new Intent(getIntent());clean.setAction(Intent.ACTION_MAIN);setIntent(clean);}else retryWidgetAction();});
 }
 private void retryWidgetAction(){if(++widgetAttempts>=24){pendingWidgetAction=null;return;}widgetHandler.postDelayed(this::dispatchWidgetAction,750L);}

}
