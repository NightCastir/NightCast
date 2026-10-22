package ir.nightcast.app;
import com.getcapacitor.JSObject;import com.getcapacitor.Plugin;import com.getcapacitor.PluginCall;import com.getcapacitor.PluginMethod;import com.getcapacitor.annotation.CapacitorPlugin;import android.content.Context;import android.content.Intent;import android.os.Build;
@CapacitorPlugin(name="NightCastWidgetBridge")
public final class NightCastWidgetBridge extends Plugin {
 @PluginMethod public void updatePlaybackState(PluginCall call){
  JSObject d=call.getData();android.content.SharedPreferences p=getContext().getApplicationContext().getSharedPreferences(NightCastRadioWidgetProvider.PREFS,android.content.Context.MODE_PRIVATE);
  org.json.JSONArray queue=d.optJSONArray("queue");p.edit().putString("current_url",d.optString("currentUrl","")).putString("current_id",d.optString("currentId","")).putInt("queue_index",d.optInt("currentIndex",-1)).putString("queue_json",queue==null?"[]":queue.toString()).putString("previous_url",d.optString("previousUrl","")).putString("next_url",d.optString("nextUrl","")).putString("previous_title",d.optString("previousTitle","")).putString("next_title",d.optString("nextTitle","")).apply();
  NightCastRadioWidgetProvider.updateAll(getContext().getApplicationContext(),d.optString("title","NightCast Radio"),d.optString("artist","رادیوی فرهنگی NightCast"),d.optBoolean("isPlaying",false),d.optBoolean("canSkip",false));call.resolve();
 }
 @PluginMethod public void getPlaybackState(PluginCall call){
  android.content.SharedPreferences p=getContext().getApplicationContext().getSharedPreferences(NightCastRadioWidgetProvider.PREFS,Context.MODE_PRIVATE);JSObject out=new JSObject();
  out.put("active",NightCastPlaybackService.isActive);out.put("isPlaying",NightCastPlaybackService.isPlaying);out.put("currentUrl",p.getString("current_url",""));out.put("title",p.getString("title","NightCast Radio"));out.put("artist",p.getString("artist","رادیوی فرهنگی NightCast"));call.resolve(out);
 }
 @PluginMethod public void controlNativePlayback(PluginCall call){
  String action=call.getData().optString("action","pause");if(!java.util.Arrays.asList("play","pause","next","previous","stop").contains(action)){call.reject("Unsupported playback action");return;}
  Intent i=new Intent(getContext(),NightCastPlaybackService.class).setAction(action);if(Build.VERSION.SDK_INT>=26)getContext().startForegroundService(i);else getContext().startService(i);call.resolve();
 }
 @PluginMethod public void stopNativePlayback(PluginCall call){
  getContext().stopService(new Intent(getContext(),NightCastPlaybackService.class));call.resolve();
 }
}