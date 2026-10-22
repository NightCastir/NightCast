package ir.nightcast.app;
import com.getcapacitor.JSObject;import com.getcapacitor.Plugin;import com.getcapacitor.PluginCall;import com.getcapacitor.PluginMethod;import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="NightCastWidgetBridge")
public final class NightCastWidgetBridge extends Plugin {
 @PluginMethod public void updatePlaybackState(PluginCall call){JSObject d=call.getData();NightCastRadioWidgetProvider.updateAll(getContext().getApplicationContext(),d.optString("title","NightCast Radio"),d.optString("artist","رادیوی فرهنگی NightCast"),d.optBoolean("isPlaying",false),d.optBoolean("canSkip",false));call.resolve();}
}