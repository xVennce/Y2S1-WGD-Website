Current pages:
404 page
Game file page
Home page
Login page

File Structure:
Secure
    - userdata.json
Static
    - resources
        -3DModels
        -css
        -images
        -js
        -sounds
    - HTML Pages

Database Structure:
Userpass table:
|   ID      |       INT         | PRIMARY KEY |
|   Email   |   VARCHAR(255)    |-------------|
|   Username|   VARCHAR(30)     |-------------|
|   Password|   VARCHAR(255)    |-------------|

userdata:
|   ID      |       INT         | FOREIGN KEY |
|   Score   |       INT         |-------------|

The presenation was based on the ThreeSampleTemplet.js code

Game controls:
W - up
A - Left
S - Right
D - Down
Ui also controls the helicopter

features:
- Ui
- Skybox
- 3D model import
- Background Audio on click
- Player interaction with 3D model