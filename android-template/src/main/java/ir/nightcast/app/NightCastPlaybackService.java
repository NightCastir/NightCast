package ir.nightcast.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;

/**
 * Fallback playback engine for widget actions after the WebView activity process has gone away.
 * While MainActivity is alive, widget actions are routed back to the existing HTML5 player instead.
 */
public final class NightCastPlaybackService extends Service {
 private static final String CHANNEL="nightcast_playback";
 private static final int NOTIFICATION_ID=7401;
 static volatile boolean isActive=false,isPlaying=false;
 private MediaPlayer player;
 private MediaSession session;
 private boolean prepared=false;
 private String title="NightCast Radio",artist="رادیوی فرهنگی NightCast",currentUrl="";
 @Override public void onCreate(){
  super.onCreate();isActive=true;createChannel();
  session=new MediaSession(this,"NightCastRadio");
  session.setCallback(new MediaSession.Callback(){
   @Override public void onPlay(){handle("play");}
   @Override public void onPause(){handle("pause");}
   @Override public void onSkipToNext(){handle("next");}
   @Override public void onSkipToPrevious(){handle("previous");}
   @Override public void onStop(){handle("stop");}
  });
  session.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS|MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);session.setActive(true);
 }
 @Override public int onStartCommand(Intent intent,int flags,int startId){
  String action=intent==null?"play":intent.getAction();if(action==null)action="play";
  startForeground(NOTIFICATION_ID,notification(false));handle(action);return START_NOT_STICKY;
 }
 private SharedPreferences prefs(){return getSharedPreferences(NightCastRadioWidgetProvider.PREFS,Context.MODE_PRIVATE);}
 private void handle(String action){
  if("pause".equals(action)){if(player!=null&&prepared&&player.isPlaying())player.pause();setState(false);return;}
  if("stop".equals(action)){releasePlayer();setState(false);stopForeground(true);stopSelf();return;}
  if("next".equals(action)||"previous".equals(action)){
   SharedPreferences p=prefs();boolean forward="next".equals(action);String key=forward?"next_url":"previous_url";String url=p.getString(key,"");
   if(url!=null&&!url.trim().isEmpty()){
    String oldUrl=p.getString("current_url",currentUrl);String oldTitle=p.getString("title",title);String oldArtist=p.getString("artist",artist);
    title=p.getString(forward?"next_title":"previous_title","NightCast Radio");artist=oldArtist;
    SharedPreferences.Editor edit=p.edit().putString("current_url",url).putString("title",title).putString("artist",artist);
    if(forward){edit.putString("previous_url",oldUrl).putString("previous_title",oldTitle).putString("next_url","").putString("next_title","");}
    else{edit.putString("next_url",oldUrl).putString("next_title",oldTitle).putString("previous_url","").putString("previous_title","");}
    edit.apply();currentUrl=url;playUrl(url);
   }else setState(false);
   return;
  }
  if("play".equals(action)){
   if(player!=null&&prepared){if(!player.isPlaying()){player.start();setState(true);}return;}
   SharedPreferences p=prefs();currentUrl=p.getString("current_url","");title=p.getString("title","NightCast Radio");artist=p.getString("artist","رادیوی فرهنگی NightCast");
   if(currentUrl.trim().isEmpty()){setState(false);stopForeground(true);stopSelf();return;}playUrl(currentUrl);
  }
 }
 private void playUrl(String url){
  releasePlayer();currentUrl=url;prepared=false;
  try{
   player=new MediaPlayer();
   player.setWakeMode(getApplicationContext(),PowerManager.PARTIAL_WAKE_LOCK);
   player.setAudioAttributes(new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA).setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build());
   player.setOnPreparedListener(mp->{prepared=true;mp.start();setState(true);});
   player.setOnCompletionListener(mp->{setState(false);releasePlayer();});
   player.setOnErrorListener((mp,what,extra)->{setState(false);releasePlayer();stopForeground(true);stopSelf();return true;});
   player.setDataSource(url);setState(false);player.prepareAsync();
  }catch(Exception e){setState(false);releasePlayer();stopForeground(true);stopSelf();}
 }
 private void setState(boolean playing){
  isPlaying=playing;
  if(session!=null){
   session.setMetadata(new MediaMetadata.Builder().putString(MediaMetadata.METADATA_KEY_TITLE,title).putString(MediaMetadata.METADATA_KEY_ARTIST,artist).build());
   long actions=PlaybackState.ACTION_PLAY|PlaybackState.ACTION_PAUSE|PlaybackState.ACTION_PLAY_PAUSE|PlaybackState.ACTION_SKIP_TO_NEXT|PlaybackState.ACTION_SKIP_TO_PREVIOUS|PlaybackState.ACTION_STOP;
   session.setPlaybackState(new PlaybackState.Builder().setActions(actions).setState(playing?PlaybackState.STATE_PLAYING:PlaybackState.STATE_PAUSED,player!=null&&prepared?player.getCurrentPosition():0,1f).build());
  }
  SharedPreferences p=prefs();NightCastRadioWidgetProvider.updateAll(this,title,artist,playing,!p.getString("previous_url","").isEmpty()||!p.getString("next_url","").isEmpty());
  NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);if(nm!=null)nm.notify(NOTIFICATION_ID,notification(playing));
 }
 private Notification notification(boolean playing){
  Intent open=new Intent(this,MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP|Intent.FLAG_ACTIVITY_CLEAR_TOP);
  PendingIntent content=PendingIntent.getActivity(this,7402,open,pendingFlags());
  Intent action=new Intent(this,NightCastPlaybackService.class).setAction(playing?"pause":"play");
  PendingIntent control=PendingIntent.getService(this,7403,action,pendingFlags());
  Notification.Builder b=Build.VERSION.SDK_INT>=26?new Notification.Builder(this,CHANNEL):new Notification.Builder(this);
  b.setSmallIcon(android.R.drawable.ic_media_play).setContentTitle(title).setContentText(artist).setContentIntent(content).setOngoing(playing).setOnlyAlertOnce(true).addAction(new Notification.Action.Builder(playing?android.R.drawable.ic_media_pause:android.R.drawable.ic_media_play,playing?"Pause":"Play",control).build());
  if(Build.VERSION.SDK_INT>=21)b.setVisibility(Notification.VISIBILITY_PUBLIC);
  return b.build();
 }
 private void createChannel(){if(Build.VERSION.SDK_INT>=26){NotificationChannel ch=new NotificationChannel(CHANNEL,"NightCast playback",NotificationManager.IMPORTANCE_LOW);ch.setDescription("پخش صوتی NightCast");((NotificationManager)getSystemService(NOTIFICATION_SERVICE)).createNotificationChannel(ch);}}
 private int pendingFlags(){int f=PendingIntent.FLAG_UPDATE_CURRENT;if(Build.VERSION.SDK_INT>=23)f|=PendingIntent.FLAG_IMMUTABLE;return f;}
 private void releasePlayer(){if(player!=null){try{player.reset();player.release();}catch(Exception ignored){}player=null;}prepared=false;}
 @Override public void onDestroy(){isActive=false;isPlaying=false;releasePlayer();NightCastRadioWidgetProvider.updateAll(this,prefs().getString("title","NightCast Radio"),prefs().getString("artist","رادیوی فرهنگی NightCast"),false,!prefs().getString("previous_url","").isEmpty()||!prefs().getString("next_url","").isEmpty());NotificationManager nm=(NotificationManager)getSystemService(NOTIFICATION_SERVICE);if(nm!=null)nm.cancel(NOTIFICATION_ID);if(session!=null){session.setActive(false);session.release();session=null;}super.onDestroy();}
 @Override public IBinder onBind(Intent intent){return null;}
}