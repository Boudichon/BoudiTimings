# BoudiTimings

This application is a tool to help you manage your commands in the game "Tribal Wars".
You can copy paste your attack planner commands in the app and it will set up timers for each command.
You will receive a notification before every attacks.
You can close the app after starting the countdown, it will keep running in the background.

Since every planner has their own format, it might not work with all of them. I tried to make it support most formats no matter what tool is used, but it's possible that some of them won't be supported. Please double check the confirmation screen to make sure it parsed the commands correctly before starting.
I tested with a handful of planners, including several Red Alert planners (single village and mass attack), devilicious.dev (default format and with "Group by hour" feature) and with www.fxutility.net


<sub>*This app was made in 3 days with no prior knowledge of React-Native. It was mostly done using various snippets of code found in package documentations and code generated from ChatGPT with some manual adjustments so I apologize for the messiness of some functions (Mostly the time parsing stuff)*</sub>
