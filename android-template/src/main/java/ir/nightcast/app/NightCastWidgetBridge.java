package ir.nightcast.app;
import com.getcapacitor.JSObject;import com.getcapacitor.Plugin;import com.getcapacitor.PluginCall;import com.getcapacitor.PluginMethod;import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="NightCastWidgetBridge")
public final class NightCastWidgetBridge extends Plugin {
 @PluginMethod public void updatePlaybackState(PluginCall call){
  JSObject d=call.getData();android.content.SharedPreferences p=getContext().getApplicationContext().getSharedPreferences(NightCastRadioWidgetProvider.PREFS,android.content.Context.MODE_PRIVATE);
  p.edit().putString("current_url",d.optString("currentUrl","")).putString("previous_url",d.optString("previousUrl","")).putString("next_url",d.optString("nextUrl","")).putString("previous_title",d.optString("previousTitle","")).putString("next_title",d.optString("nextTitle","")).apply();
  NightCastRadioWidgetProvider.updateAll(getContext().getApplicationContext(),d.optString("title","NightCast Radio"),d.optString("artist","رادیوی فرهنگی NightCast"),d.optBoolean("isPlaying",false),d.optBoolean("canSkip",false));call.resolve();
 }
}