/*
=================================================

NightCast Library Module

File:
users/js/features/library.js

Responsibilities:

- Listening history
- Favorites
- Downloads
- Saved podcasts
- Local guest storage
- User library sync preparation

Dependencies:

- api.js
- auth.js
- player.js

=================================================
*/


(function(){

"use strict";



window.NightCast =
window.NightCast || {};





const Library = {





/*
=================================================
CONFIG
=================================================
*/


config:{


storageKey:"NightCastLibrary",


maxHistory:100,


maxFavorites:200,


maxDownloads:200,


},







state:{


history:[],


favorites:[],


downloads:[],


saved:[]


},







/*
=================================================
INIT
=================================================
*/


init(){



this.loadLocal();



this.bindEvents();



console.log(
"NightCast Library Initialized"
);



},







/*
=================================================
LOAD LOCAL DATA
=================================================
*/


loadLocal(){



try{



const data =
localStorage.getItem(
this.config.storageKey
);





if(data){


const parsed =
JSON.parse(data);



this.state =
{


...this.state,


...parsed


};


}



}
catch(error){


console.error(
"Library Load Error:",
error
);


}



},







/*
=================================================
SAVE LOCAL DATA
=================================================
*/


save(){



try{



localStorage.setItem(

this.config.storageKey,

JSON.stringify(
this.state
)

);



}
catch(error){



console.error(
"Library Save Error:",
error
);



}



},







/*
=================================================
EVENT BINDING
=================================================
*/


bindEvents(){



const historyButton =
document.getElementById(
"historyButton"
);



const favoritesButton =
document.getElementById(
"favoritesButton"
);




const downloadsButton =
document.getElementById(
"downloadsButton"
);




const savedButton =
document.getElementById(
"savedButton"
);







if(historyButton){


historyButton.addEventListener(
"click",
()=>{


this.openSection(
"history"
);


});


}







if(favoritesButton){


favoritesButton.addEventListener(
"click",
()=>{


this.openSection(
"favorites"
);


});


}







if(downloadsButton){


downloadsButton.addEventListener(
"click",
()=>{


this.openSection(
"downloads"
);


});


}







if(savedButton){


savedButton.addEventListener(
"click",
()=>{


this.openSection(
"saved"
);


});


}



},







/*
=================================================
OPEN LIBRARY SECTION
=================================================
*/


openSection(type){



console.log(
"Open Library:",
type
);




/*

فعلاً خروجی در Console

در نسخه بعد:

Library Modal
یا
Profile Page Section

*/


return this.get(type);



},







/*
=================================================
GET DATA
=================================================
*/


get(type){



if(!this.state[type]){


return [];

}



return this.state[type];



},







/*
=================================================
ADD HISTORY
=================================================
*/


addHistory(podcast){



if(!podcast ||
!podcast.id)
return;





const item={



id:podcast.id,


title:podcast.title || "",


cover:podcast.cover || "",


author:podcast.author || "",


audio:podcast.audio || "",


playedAt:
Date.now()



};






// حذف تکراری

this.state.history =
this.state.history.filter(
(item)=>
item.id !== podcast.id
);





this.state.history.unshift(
item
);





if(
this.state.history.length >
this.config.maxHistory
){


this.state.history.pop();


}






this.save();




},
    /*
=================================================
FAVORITES
=================================================
*/


addFavorite(podcast){



if(!podcast ||
!podcast.id)
return false;





const exists =
this.state.favorites.some(
(item)=>
item.id === podcast.id
);





if(exists)
return false;







const item={



id:podcast.id,


title:
podcast.title || "",


cover:
podcast.cover || "",


author:
podcast.author || "",


audio:
podcast.audio || "",



addedAt:
Date.now()



};







this.state.favorites.unshift(
item
);







if(
this.state.favorites.length >
this.config.maxFavorites
){


this.state.favorites.pop();


}






this.save();




return true;



},







/*
=================================================
REMOVE FAVORITE
=================================================
*/


removeFavorite(id){



if(!id)
return;



this.state.favorites =
this.state.favorites.filter(
(item)=>
item.id !== id
);



this.save();



},







/*
=================================================
TOGGLE FAVORITE
=================================================
*/


toggleFavorite(podcast){



if(
this.isFavorite(
podcast.id
)
){



this.removeFavorite(
podcast.id
);



return false;


}




this.addFavorite(
podcast
);



return true;



},







/*
=================================================
CHECK FAVORITE
=================================================
*/


isFavorite(id){



return this.state.favorites.some(
(item)=>
item.id === id
);



},







/*
=================================================
DOWNLOADS
=================================================
*/


addDownload(podcast){



if(!podcast ||
!podcast.id)
return;




const item={



id:
podcast.id,


title:
podcast.title || "",


cover:
podcast.cover || "",


audio:
podcast.audio || "",


downloadedAt:
Date.now()



};






this.state.downloads =
this.state.downloads.filter(
(item)=>
item.id !== podcast.id
);






this.state.downloads.unshift(
item
);






if(
this.state.downloads.length >
this.config.maxDownloads
){


this.state.downloads.pop();


}






this.save();




},







/*
=================================================
REMOVE DOWNLOAD
=================================================
*/


removeDownload(id){



this.state.downloads =
this.state.downloads.filter(
(item)=>
item.id !== id
);



this.save();



},







/*
=================================================
SAVED PODCASTS
=================================================
*/


addSaved(podcast){



if(!podcast ||
!podcast.id)
return false;





const exists =
this.state.saved.some(
(item)=>
item.id === podcast.id
);






if(exists)
return false;







this.state.saved.unshift({



id:
podcast.id,


title:
podcast.title || "",


cover:
podcast.cover || "",


author:
podcast.author || ""



});







this.save();



return true;



},







/*
=================================================
REMOVE SAVED
=================================================
*/


removeSaved(id){



this.state.saved =
this.state.saved.filter(
(item)=>
item.id !== id
);



this.save();



},







/*
=================================================
CHECK SAVED
=================================================
*/


isSaved(id){



return this.state.saved.some(
(item)=>
item.id === id
);



},







/*
=================================================
CLEAR LIBRARY
=================================================
*/


clear(){



this.state={


history:[],


favorites:[],


downloads:[],


saved:[]


};





this.save();



},
    /*
=================================================
AUTH SYNC PREPARATION
=================================================
*/


async syncWithServer(){



/*

در حالت مهمان:
LocalStorage کافی است


در حالت کاربر وارد شده:
اطلاعات با Worker API سینک می‌شود


*/




if(
!window.NightCast ||
!NightCast.Auth
){


return;


}





const user =
NightCast.Auth.getUser
?
NightCast.Auth.getUser()
:
null;





if(!user){


return;


}







try{



const response =
await NightCastAPI.get(
"/users/library"
);






if(response){



this.state={


...this.state,


...response.data


};



this.save();



}



}
catch(error){



console.warn(
"Library sync unavailable:",
error
);



}



},







/*
=================================================
GET FULL LIBRARY
=================================================
*/


getAll(){



return {


history:
this.state.history,


favorites:
this.state.favorites,


downloads:
this.state.downloads,


saved:
this.state.saved



};



},







/*
=================================================
REMOVE ITEM BY TYPE
=================================================
*/


remove(type,id){



if(
!this.state[type]
)
return;



this.state[type] =
this.state[type].filter(
(item)=>
item.id !== id
);



this.save();



},







/*
=================================================
PLAY FROM HISTORY
=================================================
*/


play(item){



if(
window.NightCast &&
NightCast.Player
){



NightCast.Player.load(
item
);



NightCast.Player.play();



}



},







/*
=================================================
EXPORT DEBUG
=================================================
*/


debug(){



console.table(
this.state.history
);



console.table(
this.state.favorites
);



console.table(
this.state.downloads
);



console.table(
this.state.saved
);



}







};









/*
=================================================
EXPORT MODULE
=================================================
*/


window.NightCast.Library =
Library;





})();
