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

Userdata table:
|   ID      |       INT         | PRIMARY KEY |
|   Username|   VARCHAR(30)     |-------------|
|   Password|   VARCHAR(255)    |-------------|
|   Score   |       INT         |-------------|

Game:
Name: Block drop
Game controls:
W - up
A - Left
S - Right
D - Down
Ui also controls the ball

Goal:
Try to get as many golden cubes as you can without getting hit by the red cubes.

features:
- Ui
- Skybox
- 3D model import
- Background Audio on click
- Player interaction with 3D model
- The game gets harder via the increase of spawnrate
- Sound effects