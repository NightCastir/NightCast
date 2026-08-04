/*
=================================================

NightCast Ver4
Settings Manager

Responsible for:
- System Settings
- Admin Profile
- API Configuration

=================================================
*/


"use strict";



class SettingsManager {



    constructor(){


        this.init();


    }









    /*
    ========================================
    INIT
    ========================================
    */


    async init(){



        this.cacheDOM();


        this.bindEvents();


        await this.loadSettings();



    }









    /*
    ========================================
    CACHE DOM
    ========================================
    */


    cacheDOM(){



        this.siteName =

        document.getElementById(

            "siteName"

        );





        this.siteSlogan =

        document.getElementById(

            "siteSlogan"

        );





        this.siteDescription =

        document.getElementById(

            "siteDescription"

        );





        this.maxAudioSize =

        document.getElementById(

            "maxAudioSize"

        );





        this.audioFormats =

        document.getElementById(

            "audioFormats"

        );





        this.autoPublish =

        document.getElementById(

            "autoPublish"

        );





        this.allowRegister =

        document.getElementById(

            "allowRegister"

        );





        this.tokenExpire =

        document.getElementById(

            "tokenExpire"

        );





        this.apiKey =

        document.getElementById(

            "apiKey"

        );





        this.adminName =

        document.getElementById(

            "adminName"

        );





        this.adminEmail =

        document.getElementById(

            "adminEmail"

        );





        this.saveButton =

        document.getElementById(

            "saveSettings"

        );



    }









    /*
    ========================================
    EVENTS
    ========================================
    */


    bindEvents(){



        this.saveButton?.addEventListener(

            "click",

            ()=>this.save()

        );



    }





  
    /*
    ========================================
    LOAD SETTINGS
    ========================================
    */


    async loadSettings(){



        try{



            Loader.show(

                "در حال دریافت تنظیمات..."

            );






            const result =

            await API.get(

                "/settings"

            );








            if(!result.success){



                throw new Error(

                    result.message ||

                    "دریافت تنظیمات ناموفق بود"

                );



            }








            const settings =

            result.settings || {};








            this.fillSettings(

                settings

            );







        }



        catch(error){



            console.error(error);



            Toast.error(

                error.message

            );



        }



        finally{


            Loader.hide();


        }


    }









    /*
    ========================================
    FILL SETTINGS
    ========================================
    */


    fillSettings(settings){





        if(this.siteName)

        this.siteName.value =

        settings.site_name ||

        "NightCast";







        if(this.siteSlogan)

        this.siteSlogan.value =

        settings.site_slogan ||

        "پلی به سوی آینده";







        if(this.siteDescription)

        this.siteDescription.value =

        settings.description ||

        "";








        if(this.maxAudioSize)

        this.maxAudioSize.value =

        settings.max_audio_size ||

        100;







        if(this.audioFormats)

        this.audioFormats.value =

        settings.audio_formats ||

        "mp3,wav";








        if(this.autoPublish)

        this.autoPublish.value =

        settings.auto_publish ||

        "no";








        if(this.allowRegister)

        this.allowRegister.value =

        settings.allow_register ||

        "yes";








        if(this.tokenExpire)

        this.tokenExpire.value =

        settings.token_expire ||

        30;








        if(this.apiKey)

        this.apiKey.value =

        settings.api_key ||

        "";








        if(this.adminName)

        this.adminName.value =

        settings.admin_name ||

        "";








        if(this.adminEmail)

        this.adminEmail.value =

        settings.admin_email ||

        "";



    }







    /*
    ========================================
    SAVE SETTINGS
    ========================================
    */


    async save(){



        try{



            const data = {



                site_name:

                this.siteName.value.trim(),





                site_slogan:

                this.siteSlogan.value.trim(),





                description:

                this.siteDescription.value.trim(),





                max_audio_size:

                Number(

                    this.maxAudioSize.value

                ),





                audio_formats:

                this.audioFormats.value.trim(),





                auto_publish:

                this.autoPublish.value,





                allow_register:

                this.allowRegister.value,





                token_expire:

                Number(

                    this.tokenExpire.value

                ),





                admin_name:

                this.adminName.value.trim(),





                admin_email:

                this.adminEmail.value.trim()




            };








            Loader.show(

                "در حال ذخیره تنظیمات..."

            );








            const result =

            await API.put(

                "/settings",

                data

            );








            if(!result.success){



                throw new Error(

                    result.message ||

                    "ذخیره تنظیمات انجام نشد"

                );



            }








            Toast.success(

                "تنظیمات با موفقیت ذخیره شد"

            );






        }


        catch(error){



            Toast.error(

                error.message

            );



        }


        finally{


            Loader.hide();


        }



    }





}









/*
=================================================

START SETTINGS MANAGER

=================================================
*/


let settingsManager;



document.addEventListener(

"DOMContentLoaded",

()=>{


    settingsManager =

    new SettingsManager();



});






