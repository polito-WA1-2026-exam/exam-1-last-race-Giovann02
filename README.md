# Exam #1: "Last-Race"
## Student: s360086 PALMIGIANO GIOVANNI  

## React Client Application Routes

- Route `/`: 
    * **Purpose**: Entry point where an anonymous user can go to login form or read a brief description.
- Route `/instructions`: 
    * **Purpose**: Page which describes the game rules to the anonymous/authenticated user, where the user can go back to the Home.
- Route `/login`: 
    * **Purpose**: Login form, an anonymous user can be authenticated through this page.
- Route `/play` : 
    * **Purpose**: Initial page, where an authenticated user can memorize the network map e start planning.
- Route `/game/plan`
    * **Purpose**: Game page, where the authenticated user starts to play and see the start station and the end station and can choose a path form the available segments and therefore see the chosed segments.
- Route `/game/execute`
    * **Purpose**: Execution page, shows the coins earned during the trip and what is happened for every stations.
- Route `/result`:
    * **Purpose**: Result page, shows the total coins earned and links to the leaderboard, home and if the user wants to play again a link to the game page.
- Route `/leaderboard`:
    * **Purpose**: Ranking page, shows the global player ranking, ordered in descending order respect to the best score reached during a game.
- Route `/profile`:
    * **Purpose**: Profile page, shows the personal record with the number of games playes and the history of the games played with their informations, therefore shows the total credits earned in all games.

## API Server

- GET `/api/network`
  - **Request parameters/body**:nothing
  - **Responses body content**:
  * ```json
    {
    "lines": [
      {
        "id": 1,
        "name": "Red Line",
        "color": "#ef4444",
        "stations": [
          1,
          2,
          3,
          4
        ]
      },
      {
        "id": 2,
        "name": "Blue Line",
        "color": "#3b82f6",
        "stations": [
          1,
          5,
          6,
          7,
          8
        ]
      },
      {
        "id": 3,
        "name": "Green Line",
        "color": "#22c55e",
        "stations": [
          2,
          5,
          9,
          10
        ]
      },
      {
        "id": 4,
        "name": "Yellow Line",
        "color": "#eab308",
        "stations": [
          4,
          9,
          8,
          11,
          12
        ]
      }
    ],
    "stations": [
      {
        "id": 1,
        "name": "Centrale"
      },
      {
        "id": 2,
        "name": "Porta Velaria"
      },
      {
        "id": 3,
        "name": "Crocevia del Falco"
      },
      {
        "id": 4,
        "name": "Piazza delle Lanterne"
      },
      {
        "id": 5,
        "name": "Fontana Oscura"
      },
      {
        "id": 6,
        "name": "Borgo Sereno"
      },
      {
        "id": 7,
        "name": "Viale dei Mosaici"
      },
      {
        "id": 8,
        "name": "Torre Cinerea"
      },
      {
        "id": 9,
        "name": "Campo dell'Eco"
      },
      {
        "id": 10,
        "name": "Stazione Aurora"
      },
      {
        "id": 11,
        "name": "Giardino Nascosto"
      },
      {
        "id": 12,
        "name": "Ponte Antico"
      }
    ]
  }
  * `500 Internal Server Error`
- GET `/api/segments`
  - **Request parameters/body**:nothing
  - **Response body content**:
  * ```json
    [
      {
        "stationA": 1,
        "stationB": 2,
        "stationAName": "Centrale",
        "stationBName": "Porta Velaria",
        "id": 1
      },
      {
        "stationA": 2,
        "stationB": 3,
        "stationAName": "Porta Velaria",
        "stationBName": "Crocevia del Falco",
        "id": 2
      },
      {
        "stationA": 3,
        "stationB": 4,
        "stationAName": "Crocevia del Falco",
        "stationBName": "Piazza delle Lanterne",
        "id": 3
      },
      {
        "stationA": 1,
        "stationB": 5,
        "stationAName": "Centrale",
        "stationBName": "Fontana Oscura",
        "id": 4
      },
      {
        "stationA": 5,
        "stationB": 6,
        "stationAName": "Fontana Oscura",
        "stationBName": "Borgo Sereno",
        "id": 5
      },
      {
        "stationA": 6,
        "stationB": 7,
        "stationAName": "Borgo Sereno",
        "stationBName": "Viale dei Mosaici",
        "id": 6
      },
      {
        "stationA": 7,
        "stationB": 8,
        "stationAName": "Viale dei Mosaici",
        "stationBName": "Torre Cinerea",
        "id": 7
      },
      {
        "stationA": 2,
        "stationB": 5,
        "stationAName": "Porta Velaria",
        "stationBName": "Fontana Oscura",
        "id": 8
      },
      {
        "stationA": 5,
        "stationB": 9,
        "stationAName": "Fontana Oscura",
        "stationBName": "Campo dell'Eco",
        "id": 9
      },
      {
        "stationA": 9,
        "stationB": 10,
        "stationAName": "Campo dell'Eco",
        "stationBName": "Stazione Aurora",
        "id": 10
      },
      {
        "stationA": 4,
        "stationB": 9,
        "stationAName": "Piazza delle Lanterne",
        "stationBName": "Campo dell'Eco",
        "id": 11
      },
      {
        "stationA": 9,
        "stationB": 8,
        "stationAName": "Campo dell'Eco",
        "stationBName": "Torre Cinerea",
        "id": 12
      },
      {
        "stationA": 8,
        "stationB": 11,
        "stationAName": "Torre Cinerea",
        "stationBName": "Giardino Nascosto",
        "id": 13
      },
      {
        "stationA": 11,
        "stationB": 12,
        "stationAName": "Giardino Nascosto",
        "stationBName": "Ponte Antico",
        "id": 14
      }
    ]
  * `500 Internal Server Error`
- POST `/api/game/start`
  - request parameters and request body content: Nothing, required the session cookies `credentials: 'include'` protect by `isLoggedIn`
  - response body content:
  * ```json
      {
        "success": true,
        "startStation": {
          "id": 2,
          "name": "Porta Velaria"
        },
        "endStation": {
          "id": 11,
          "name": "Giardino Nascosto"
        },
        "message": "Game started!"
      }
  * `HTTP 500 Internal Server Error`
  * `HTTP 401 Unauthorized`
- POST `/api/game/submit`
  - **Request parameters and request body content**:  required the session cookies `credentials: 'include'` protect by `isLoggedIn`
    * ```json  
        {
          "route": [
            { "stationA": 1, "stationB": 2, "stationAName": "Centrale", "stationBName": "Porta Velaria" },
            { "stationA": 2, "stationB": 3, "stationAName": "Porta Velaria", "stationBName": "Crocevia" }
          ]
        }
    * ```json 
        {
          "route": [] 
        }
  - **Response body content**: 
      * ```json 
        {
          "success": true,
          "invalid": false,
          "steps": [
            {
              "from": "Centrale",
              "to": "Loreto",
              "event": "Treno in perfetto orario!",
              "effect": 0,
              "coins": 20
            },
            {
              "from": "Loreto",
              "to": "Piola",
              "event": "Controllore fiscale: multa salata",
              "effect": -5,
              "coins": 15
            }
          ]
        }
      * ```json 
        {
          "success": false,
          "invalid": true,
          "steps": []
        }
      *  `400 Bad Request`
        ```json 
          {
            "error": "Nessuna partita attiva"
          }

      * `401 Unathorized`
- POST `/api/game/finish`
  - **Request parameters and request body content**:  required the session cookies `credentials: 'include'` protect by `isLoggedIn`
    * ```json  
        ```json
        {
          "score": 15
        }
        ```
    
  - **Response body content**:
    * ```json 
          {
            "success": true,
            "message": "Game finished and score saved successfully"
          }
      ```
    * `400 Bad Request` - 
    ```json 
    { "error": "No active game to finish" }
    ```
    * `401 Unauthorized`
    * `500 Internal Serve Error`
- GET `/api/leaderboard`
  - **Request parameters and request body content**: Nothing
  - **Response body content**:
    * ```json 
      [
        {
          "username": "Marco",
          "score": 29,
          "rank": 1
        },
        {
          "username": "Giulia",
          "score": 14,
          "rank": 2
        }
      ]
      ```
    * `500 Internal Server Error`
- GET `/api/user/profile`
  - **Request parameters and request body content**: Nothing
  - **Response body content**:
    ```json  
    {
    "username": "Marco",
    "totalCredits": 48,
    "bestScore": 29,
    "gamesPlayed": 6,
    "history": [
      {
        "id": 7,
        "score": 0,
        "played_at": "2026-06-22 10:08:35"
      },
      {
        "id": 6,
        "score": 19,
        "played_at": "2026-06-21 18:30:11"
      },
      {
        "id": 4,
        "score": 0,
        "played_at": "2026-06-19 11:16:43"
      },
      {
        "id": 3,
        "score": 0,
        "played_at": "2026-06-19 09:48:45"
      },
      {
        "id": 2,
        "score": 29,
        "played_at": "2026-06-19 09:47:25"
      },
      {
        "id": 1,
        "score": 0,
        "played_at": "2026-06-10 22:01:32"
      }
    ]
    }
  ```
  * `401 Unauthorized`
  * `500 Internal Serve Error`
- POST `/api/auth/login`
  - **Request parameters and request body content**: 
    ```json
    {
      "username": "Lucia",
      "password": "pass456"
    }
    ```
  - **Response body content**:
    * ```json
      {
        "success": true,
        "user": {
          "id": 2,
          "username": "Lucia"
        }
      }
      ```
    * `401 unauthorize`
    * `400 Bad Request`
    * `500 Internal Server Error`
- DELETE `/api/sessions/current`
  - **Request parameters and request body content**: required the session cookies `credentials: 'include'` 
  - **Response body content**: 
  * `200 OK`
- GET `/api/auth/me`
  - **Request parameters**: Npthing. required the session cookies `credentials: 'include'` 
  - **Response body content**:
    * ```json
      {
        "user": {
          "id": 1,
          "username": "Marco"
        }
      }
      ```
    * ```json
      {
        "user": null
      }
      ```

## Database Tables

- Table `users` - contains id, username, password_hash, salt, best_score
- Table `lines` - contains id, name, color
- Table `stations` - contains id, name
- Table `line_stations` - contains line_id, station_id, position
- Table `events` - contains id, description, effect
- Table `games` - contains id, user_id, score, played_at

## Main React Components

- `GamePlanning` (in `client/src/components/GamePlanning.jsx`): Main gameplay interface, including:  the departure and arrive random stations,segments available to choose, chosed segments and a timer. Here user play with the game and choose the available segments and can track the remained time through the timer.
- `LoginForm` (in `client/src/components/LoginForm.jsx`): Authentication form with username and password fields. Calls the login handler on submit and redirects to the authenticated user homepage on success.
- `NetworkMap` (in `client/src/components/NetworkMap.jsx`): Map where are shown the stations linked by a line colored by a specfic colour used to help the user to memorize the various line, or are hidden during a game.
- `Leaderboard` (in `client/src/components/Leaderboard.jsx`): Ranking of the global players ordered in ascending order.
- `Instructions` (in `client/src/components/Instructions.jsx`): Instruction interface where both type o users can learn how to play to the game.

(only _main_ components, minor ones may be skipped)

## Screenshot

![Screenshot](/img/RANKING.png)
![Screenshot](/img/gaming.png)




## Users Credentials

- Marco, pass123 
- Lucia, pass456
- Giulia, pass789

## Use of AI Tools
I have based on the project course site which has been develeped during the semester. I've used Gemini as AI and adapted its code to mine, used in server side to write code and create/fill the DB, for complex code like : `validateRoute` and `/api/game/submit`. For client side I used it especially to design th side for html and thing reletade to this, and also for complex code like how to display in correct order the chosed segments during the game.
