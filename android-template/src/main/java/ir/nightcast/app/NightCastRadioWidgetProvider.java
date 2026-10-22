package ir.nightcast.app;
import android.app.PendingIntent;import android.appwidget.AppWidgetManager;import android.appwidget.AppWidgetProvider;import android.content.ComponentName;import android.content.Context;import android.content.Intent;import android.content.SharedPreferences;import android.os.Build;import android.widget.RemoteViews;
public final class NightCastRadioWidgetProvider extends AppWidgetProvider {
 static final String PREFS="nightcast_radio_widget",KEY_TITLE="title",KEY_ARTIST="artist",KEY_PLAYING="playing",KEY_CAN_SKIP="can_skip";
 @Override public void onUpdate(Context c,AppWidgetManager m,int[] ids){for(int id:ids)updateOne(c,m,id);}
 static void updateAll(Context c,String title,String artist,boolean playing,boolean canSkip){
  c.getSharedPreferences(PREFS,Context.MODE_PRIVATE).edit().putString(KEY_TITLE,safe(title,"NightCast Radio")).putString(KEY_ARTIST,safe(artist,"رادیوی فرهنگی NightCast")).putBoolean(KEY_PLAYING,playing).putBoolean(KEY_CAN_SKIP,canSkip).apply();
  AppWidgetManager m=AppWidgetManager.getInstance(c);for(int id:m.getAppWidgetIds(new ComponentName(c,NightCastRadioWidgetProvider.class)))updateOne(c,m,id);
 }
 private static void updateOne(Context c,AppWidgetManager m,int id){
  SharedPreferences p=c.getSharedPreferences(PREFS,Context.MODE_PRIVATE);RemoteViews v=new RemoteViews(c.getPackageName(),R.layout.widget_nightcast_radio);boolean skip=p.getBoolean(KEY_CAN_SKIP,false);
  v.setTextViewText(R.id.widget_title,safe(p.getString(KEY_TITLE,"NightCast Radio"),"NightCast Radio"));v.setTextViewText(R.id.widget_artist,safe(p.getString(KEY_ARTIST,"رادیوی فرهنگی NightCast"),"رادیوی فرهنگی NightCast"));v.setTextViewText(R.id.widget_status,p.getBoolean(KEY_PLAYING,false)?"در حال پخش":"متوقف شده");
  v.setViewVisibility(R.id.widget_previous,skip?android.view.View.VISIBLE:android.view.View.GONE);v.setViewVisibility(R.id.widget_next,skip?android.view.View.VISIBLE:android.view.View.GONE);
  Intent open=new Intent(c,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);v.setOnClickPendingIntent(R.id.widget_root,PendingIntent.getActivity(c,3000+id,open,flags()));
  v.setOnClickPendingIntent(R.id.widget_play,action(c,MainActivity.ACTION_WIDGET_PLAY,3100+id));v.setOnClickPendingIntent(R.id.widget_pause,action(c,MainActivity.ACTION_WIDGET_PAUSE,3200+id));v.setOnClickPendingIntent(R.id.widget_previous,action(c,MainActivity.ACTION_WIDGET_PREVIOUS,3300+id));v.setOnClickPendingIntent(R.id.widget_next,action(c,MainActivity.ACTION_WIDGET_NEXT,3400+id));m.updateAppWidget(id,v);
 }
 private static PendingIntent action(Context c,String a,int r){Intent i=new Intent(c,MainActivity.class).setAction(a).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);return PendingIntent.getActivity(c,r,i,flags());}
 private static int flags(){int f=PendingIntent.FLAG_UPDATE_CURRENT;if(Build.VERSION.SDK_INT>=23)f|=PendingIntent.FLAG_IMMUTABLE;return f;}
 private static String safe(String s,String d){return s==null||s.trim().isEmpty()?d:s.trim();}
}