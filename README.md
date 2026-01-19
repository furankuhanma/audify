I will make this app vibe-coded but i will document every step of the way.

This app is like spotify but for my personal use only. I will try to add features from spotify premium and put on this app for free
and also i will get rid of ads so i can enjoy music continously.

Im also planning to put ai or maybe advance so i can get the best recommendations according to my current feeling and music taste.


Front-end looks good made by google gemini so i will proceed to make the back-end.

The first feature i'm going to add is the youtube api, i need to fetch data from youtube and it must play as mp3. and when it comes to searching youtube there's alot of video so this app will automatically filter out those and more focus on music searching. and i will get rid of the mock up data


Now that it's working, it can fetch music, the ai is working i will start to add the download feature like sqlite  so i can use it offline.




------------------------------------------------------------------------------------------------------------


the offline feature is now available so there are more things to add like 


the shuffle, repeat, next, etc. feature on the player component. I need to make it functional.(smart recommending algorithm) ///
add or delete playlist /
account sidebar functional
vibestream ai should be able to give music reccomendations that are clickable 
keep message history 
be able to chat with friends and share music
profile details like facebook
user bug session fix ///

and some ui fixes 
offline library ///
progress download 
playlist track 
download animation badge 
change branding ///
remove create albums and albums on library ///


listening history///
user data should only be accessible to the data ///
add to playlist ontoggle 
home page, add more music below (infinite scroll)
liked songs ///
search lyricss algorithm
search genre (pop, hip-hop, rock etc.)
add more storage for offline


there's a mistake in the backend. when the music get's stream it has to automatically be saved in the database table 
because in the listening history it cannot be recorded unless it's in the tracks table. and sometimes even if it's in the tracks table it does not save in the listening history, i think we need to identify everytime who is asking for the stream so we can save every song being stream and user who is streaming it 




depending on the current user's mode (smart shuffle or repeat current song) it will override the shuffle but don't delete the user queue until it's all done so that we won't waste alot of tokens. or you can suggest an algorithm that doesn't require ai api just math. 

smart shuffle algorithm:
get user data from database, user liked songs, listening history, playlist, search history(no need to fetch all), just fetch the latest data only maybe the last 20-30 songs just enough samples for the ai to identify the user mood or music taste favorite artist etc. any data that can signal what is the user's interest. 
then return 15-20 reccomendation that will be be qeued if they are in the smart shuffle mode.

repeat current song
it will keep repeating the same song  