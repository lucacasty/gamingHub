"use strict";

const http = require("http");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser"); //Modulo per leggere i parametri passati dentro il body (POST)
const app = express(); //Ritorna un'app da richiamare all'avvio del server e funge da dispatcher
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fileupload = require("express-fileupload");
const { ESRCH } = require("constants");
const PORT = process.env.PORT || 1337;
const TTL_Token = 2592000; //30 giorni
const mongo = require("mongodb");
const mongoClient = mongo.MongoClient;
const DBNAME = "ProgettoGaming"
const CONNECTIONSTRING = "mongodb://lucacastelli:Felix2012@cluster0-shard-00-00.f6esz.mongodb.net:27017,cluster0-shard-00-01.f6esz.mongodb.net:27017,cluster0-shard-00-02.f6esz.mongodb.net:27017/test?replicaSet=atlas-1477sw-shard-0&ssl=true&authSource=admin";
const CONNECTIONOPTIONS = { useNewUrlParser: true, useUnifiedTopology: true };
const async = require("async");
const colors = require("colors");
const { stringify } = require("querystring");
const { connect } = require("http2");
const request = require("request");
let nodemailer = require('nodemailer');
const server = http.createServer(app);
var ObjectId = require("mongodb").ObjectId;
const io = require("socket.io")(server);
var cloudinary = require('cloudinary').v2;
cloudinary.config({
    cloud_name: 'dyl9k5mhb',
    api_key: '239825865528559',
    api_secret: '4aEeTSGewdtEYZ3c73rwudsrcZc'
});
let currentUser;
let friend;
let privateKey;

server.listen(PORT, function () { /*Tra PORT  la fun di callback si potrebbe
                                specificare su quale interfaccia vogliamo che stia in ascolto, 
                                se viene omesso come in questo caso, si mette in ascolto su tutte*/
    console.log("Server in ascolto sulla porta " + PORT);
    init();
});

let paginaErrore = "";
function init() {
    fs.readFile("./static/error.html", function (err, data) {
        if (!err)
            paginaErrore = data.toString();
        else
            paginaErrore = "<h1>Risorsa non trovata</h1>";
    });
    fs.readFile("./keys/private.key", function (err, data) {
        if (!err) {
            privateKey = data.toString();
        }
        else {
            //Richiamo la route di gestione degli errori
            console.log("File mancante: private.key");
            server.close();
        }
    })
}

//#region LOG & DEBUG ROUTE

/*LOG DELLA RICHIESTA*/
app.use("/", function (req, res, next) { //Next --> Operatore che consente di far proseguire la scansione -> next();
    // originalUrl contiene la risorsa richiesta
    console.log("----> " + req.method + ": " + req.originalUrl);
    next();
});
/*GESTIONE RISORSE STATICHE*/
app.use("/", express.static("./static")); //Il metodo express.static permette di gestire la richiesta di risorse statica
//Quali pagine o immagini. Se trova nella cartella specificata la risorsa la restituisce e si ferma, altrimenti esegue next()

app.use("/", fileupload({
    "limits": { "fileSize": (50 * 1024 * 1024) }  //50mb
}));
/*LETTURA PARAMETRI NEL BODY DELLA RICHIESTA*/
app.use(bodyParser.json({ limit: '500mb' }));

app.use(bodyParser.urlencoded({
    limit: '500mb',
    parameterLimit: 10000000000000,
    extended: true
}));

/*LOG DEI PARAMETRI*/
app.use("/", function (req, res, next) {
    if (req.query != {}) //.query -> parametri url-encoded
        console.log("parametri GET: " + JSON.stringify(req.query));

    if (req.body != {}) // .body -> parametri iniettati dal bodyParser (riga 42-43)
        console.log("parametri BODY: " + JSON.stringify(req.body));

    next();
})

/*ROUTE CHE PERMETTE LA RISPOSTA A QUALUNQUE RICHIESTA*/
app.use("/", function (req, res, next) {
    res.setHeader("Access-Control.Allow-Origin", "*");
    next();
})

//#endregion

//#region ROUTE SPECIFICI

app.post('/api/login', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");

            let username = req.body.username;
            collection.findOne({ "$or": [{ "username": username }, { "mail": username }] }, function (err, dbUser) {
                if (err)
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                else {
                    if (dbUser == null)
                        res.status(401).send("Username e/o Password non validi");
                    else {
                        bcrypt.compare(req.body.password, dbUser.password, function (err, ok) {
                            if (err)
                                res.status(500).send("Internal Error in bcrypt compare").log(err.message);
                            else {
                                if (!ok)
                                    res.status(401).send("Username e/o Password non validi");
                                else {
                                    let token = createToken(dbUser);
                                    writeCookie(res, token);
                                    res.send({ "ris": "ok" });
                                }
                            }
                        });
                    }
                }
                client.close();
            })
        }
    });
});

app.post('/api/signin', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");

            let username = req.body.username;
            let mail = req.body.mail;
            let dob = req.body.dob;
            let password = req.body.password;

            collection.findOne({ "$or": [{ "username": username }, { "mail": mail }] }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                }
                else {
                    if (!data) {
                        collection.insertOne({
                            "username": username,
                            "mail": mail,
                            "dataNascita": dob,
                            "password": bcrypt.hashSync(password, 10)
                        }, function (err, data) {
                            if (err)
                                res.status(500).send("Internal Error in Query Execution").log(err.message);
                            else
                                res.send({ "ris": "ok" });
                            client.close();
                        });
                    }
                    else {
                        res.send({ "ris": "nok" });
                        client.close();
                    }

                }
            });
        }
    });
});

app.post('/api/sendMail', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");

            let mail = req.body.mail;

            collection.findOne({ "mail": mail }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                }
                else {
                    if (data) {
                        var transporter = nodemailer.createTransport({
                            service: 'gmail',
                            auth: {
                                user: 'gamingHub2k21@gmail.com',
                                pass: 'Felix2012?',
                                accessToken: "AIzaSyCW4UKYwj5zfLgPUl6j3zAeUmyfdSnPOpY"
                            }
                        });

                        var mailOptions = {
                            from: 'gamingHub2k21@gmail.com',
                            to: mail,
                            subject: 'Recover password GAMING HUB',
                            text: 'Clicca qua per reimpostare la password.\nhttp://localhost:1337/login/recoverPwd.html'
                        };

                        transporter.sendMail(mailOptions, function (error, info) {
                            if (error) {
                                console.log(error);
                            } else {
                                console.log('Email sent: ' + info.response);
                            }
                        });
                        res.send({ "ris": "ok" });
                        client.close();
                    }
                    else {
                        res.send({ "ris": "nok" });
                        client.close();
                    }

                }
            });
        }
    });
});

app.post('/api/forgotPwd', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");

            let username = req.body.username;
            let password = req.body.password;

            collection.updateOne({ "$or": [{ "username": username }, { "mail": username }] },
                { "$set": { "password": bcrypt.hashSync(password, 10) } },
                function (err, data) {
                    if (err)
                        res.status(500).send("Internal Error in Query Execution").log(err.message);
                    else {
                        if (data)
                            res.send({ "ris": "ok" });
                        else
                            res.send({ "ris": "nok" });
                        client.close();
                    }
                }
            );
        }
    });
});

app.use("/api", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get("/index.html", function (req, res, next) {
    controllaToken(req, res, next);
});

app.use("/api/", function (req, res, next) {
    controllaToken(req, res, next);
});

app.get('/api/test', function (req, res, next) {
    controllaToken(req, res, next);
    res.send({ "ris": currentUser });
});

//La route delle risorse statiche DEVE essere eseguita DOPO controllaToken()
app.use('/', express.static("./static"));

/************* INIZIO SERVIZI ***************** */

app.post("/api/controlloPreferenze", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("User");

            collection.findOne({ "username": req.body.username }, function (err, data) {
                if (err)
                    res.status(503).send("Errore di connessione al database durante l'esecuzione della query");
                else {
                    res.send(data);
                    /* if (data == null) {
                        res.send({ "ris": "noPref" });
                    }
                    else {
                        res.send(JSON.stringify(data));
                    }
                    client.close(); */
                }
            })
        }
    });
});

app.post("/api/getTeamByUsername", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("User");

            let me = req.body.myUsername;
            let you = req.body.yourUsername;

            let myTeams = [];
            let yourTeams = [];
            let yourReq = [];

            collection.findOne({ "username": me }, function (err, data) {
                if (err)
                    res.status(503).send("Errore di connessione al database durante l'esecuzione della query");
                else {
                    myTeams = data.team;
                    collection.findOne({ "username": you }, function (err, data) {
                        if (err)
                            res.status(503).send("Errore di connessione al database durante l'esecuzione della query");
                        else {
                            yourTeams = data.team;
                            yourReq = data.richieste;
                            res.send({ "myTeams": myTeams, "yourTeams": yourTeams, "yourReq": yourReq });
                        }
                    })
                }
            })
        }
    });
});

app.get("/api/elencoGiochi", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Giochi");

            let testo = req.query.testo.toLowerCase();
            let regex = new RegExp("^.*" + testo + ".*$", "i");
            collection.find({ "name": { "$regex": regex } }).limit(100).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/elencoUtenti", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("User");

            let testo = req.query.testo.toLowerCase();
            let regex = new RegExp("^.*" + testo + ".*$", "i");
            collection.find({ "username": { "$regex": regex } }).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/elencoTornei", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Tornei");

            let testo = req.query.testo.toLowerCase();
            let regex = new RegExp("^.*" + testo + ".*$", "i");
            collection.find({ "nome": { "$regex": regex } }).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/elencoTuttiTornei", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Tornei");
            collection.find().toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});


app.get("/api/elencoTeam", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Team");

            let testo = req.query.testo.toLowerCase();
            let regex = new RegExp("^.*" + testo + ".*$", "i");
            collection.find({ "nome": { "$regex": regex } }).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/infoTeam", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Team");

            let nome = req.query.name;
            collection.findOne({ "nome": nome }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/teamImage", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Team");

            let nome = req.query.name;
            collection.find({ "nome": nome }).project({ "photo": 1, "nome": 1, "founder": 1 }).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get('/api/addMembro', function (req, res, next) {
    let team = req.query.team;
    let username = req.query.username;
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Team");
            collection.updateOne({ "nome": team }, { "$push": { "members": username } }, function (err, data) {
                if (err) {
                    res.status(err.code).send(err.message);
                }
            });
            collection = db.collection("User");
            collection.updateOne({ "username": username }, { "$push": { "team": team }, "$pull": { "richieste": team } }, function (err, data) {
                if (err)
                    res.status(err.code).send(err.message);
                else {
                    res.send({ "ris": "ok" });
                }
            })
        }
    });
});

app.get('/api/addMembroTorneo', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Tornei");

            let torneo = req.query.torneo;
            let member = req.query.member;

            collection.updateOne({ "nome": torneo }, { "$push": { "members": member } }, function (err, data) {
                if (err) {
                    res.status(err.code).send(err.message);
                }
            });

            collection = db.collection("User");
            collection.updateOne({ "username": member }, { "$push": { "tornei": torneo } }, function (err, data) {
                if (err)
                    res.status(err.code).send(err.message);
                else {
                    res.send({ "ris": "ok" });
                }
            })
        }
    });
});

app.post('/api/invitoTeam', function (req, res, next) {
    let team = req.body.team;
    let username = req.body.username;
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("User");

            collection.updateOne({ "username": username }, { "$push": { "richieste": team } }, function (err, data) {
                if (err)
                    res.status(err.code).send(err.message);
                else {
                    res.send({ "ris": "ok" });
                }
            })
        }
    });
});

app.get('/api/declineRichiesta', function (req, res, next) {
    let team = req.query.team;
    let username = req.query.username;
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("User");
            collection.updateOne({ "username": username }, { "$pull": { "richieste": team } }, function (err, data) {
                if (err) {
                    res.status(err.code).send(err.message);
                }
                else {
                    res.send({ "ris": "ok" });
                }
            });
        }
    });
});

app.post('/api/creaTorneo', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Tornei");

            let name = req.body.name;
            let desc = req.body.desc;
            let game = req.body.game;
            let startingData = req.body.startingData;
            let startingTime = req.body.startingTime;
            let n4Team = req.body.n4Team;
            let maxPlayers = req.body.nPartecip;
            let me = req.body.me;

            collection.insertOne({
                "nome": name,
                "descrizione": desc,
                "gioco": parseInt(game),
                "dataInizio": startingData,
                "oraInizio": startingTime,
                "maxPlayers": parseInt(maxPlayers),
                "teamNumber": parseInt(n4Team),
                "members": [me],
                "creator": me
            }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else
                    res.send({ "ris": "ok" });
                client.close();
            });
        }
    });
});

app.get("/api/elencoTeamUser", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Team");
            let username = req.query.username;
            collection.find({ "members": username }).toArray(function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/deleteGameFromMongo", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let _id = parseInt(req.query.idGame);
            let db = client.db(DBNAME);
            let collection = db.collection("Giochi");
            collection.deleteOne({ "id": _id }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(data);
                }
                client.close();
            });
        }
    });
});

app.get("/api/datiPersonali", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("User");

            let user = req.query.username;
            collection.findOne({ "username": user }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/specificheTorneo", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Tornei");

            let nome = req.query.name;
            collection.findOne({ "nome": nome }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/uploadCambiamenti", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("User");

            let user = req.query.username;
            let newmail = req.query.newmail;
            collection.updateOne({ "username": user }, { "$set": { "mail": newmail } },
                function (err, data) {
                    if (err)
                        res.status(500).send(err.message);
                    else {
                        res.send(JSON.stringify(data));
                    }
                    client.close();
                });
        }
    });
});
app.get("/api/updatePhotoUser", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("User");

            let foto = req.query.foto;
            collection.updateOne({ "username": currentUser }, { "$set": { "imgProfilo": foto } },
                function (err, data) {
                    if (err)
                        res.status(500).send(err.message);
                    else {
                        res.send(JSON.stringify(data));
                    }
                    client.close();
                });
        }
    });
});
app.get("/api/salvaPreferenze", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("User");

            let pref = req.query.preferenze;

            collection.updateOne({ "username": currentUser }, { "$set": { "preferenze": pref }, }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.post("/api/caricaFoto", function (req, res, next) {
    cloudinary.uploader.upload(req.body.path,
        function (error, result) {
            console.log(result, error);
            if (!error) {
                res.send(JSON.stringify({ "ris": result.url }));
            }
            else {
                res.send({ "ris": "nok" });
            }
        });
});

app.get("/api/updateTeam", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Team");
            let team = req.query.team;
            let desc = req.query.desc;
            let foto = req.query.foto;
            collection.updateOne({ "nome": team }, { "$set": { "descrizione": desc, "photo": foto } }, function (err, data) {
                if (err)
                    res.status(500).send(err.message);
                else {
                    res.send(JSON.stringify(data));
                }
                client.close();
            });
        }
    });
});

app.get("/api/leaveTeam", function (req, res, next) {
    let par = req.query.par;
    console.log(par);
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Tornei");
            collection.findOne({ "partecipanti": par["nome"] }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                }
                else {
                    if (!data) {
                        collection = db.collection("Team");
                        collection.updateOne({ "nome": par["nome"] }, { "$pull": { "members": currentUser } }, function (err, data) {
                            if (err)
                                res.status(500).send(err.message);
                            else {
                                collection = db.collection("User");
                                collection.updateOne({ "username": currentUser }, { "$pull": { "team": par["nome"] } }, function (err, data) {
                                    if (err)
                                        res.status(500).send(err.message);
                                    else {
                                        res.send(JSON.stringify({ "ris": "ok" }));
                                    }
                                    client.close();
                                });
                            }
                        });
                    }
                    else {
                        res.send(JSON.stringify({ "ris": "nok" }));
                    }
                }
            });
        }
    });
});

app.get("/api/deleteTeam", function (req, res, next) {
    let par = req.query.par;
    console.log(par);
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err) {
            res.status(503).send("Errore di connessione al database");
        }
        else {
            let db = client.db(DBNAME);
            let collection = db.collection("Tornei");
            collection.findOne({ "partecipanti": par["nome"] }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                }
                else {
                    if (!data) {
                        collection = db.collection("Team");
                        collection.deleteOne({ "nome": par["nome"] }, function (err, data) {
                            if (err)
                                res.status(500).send(err.message);
                            else {
                                collection = db.collection("User");
                                collection.updateMany({ "team": par["nome"] }, { "$pull": { "team": par["nome"] } }, function (err, data) {
                                    if (err)
                                        res.status(500).send(err.message);
                                    else {
                                        res.send(JSON.stringify({ "ris": "ok" }));
                                    }
                                    client.close();
                                });
                            }
                        });
                    }
                    else {
                        res.send(JSON.stringify({ "ris": "nok" }));
                    }
                }
            });
        }
    });
});

app.post('/api/addTeam', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Team");

            let name = req.body.name;
            let desc = req.body.desc;
            let membri = req.body.membri;
            let tornei = req.body.tornei;
            let photo = req.body.photo;

            collection.findOne({ "nome": name }, function (err, data) {
                if (err) {
                    res.status(500).send("Internal Error in Query Execution").log(err.message);
                }
                else {
                    if (!data) {
                        collection.insertOne({
                            "nome": name,
                            "descrizione": desc,
                            "founder": membri[0],
                            "members": membri,
                            "tornei": tornei,
                            "trofei": tornei,
                            "photo": photo
                        }, function (err, data) {
                            if (err)
                                res.status(500).send("Internal Error in Query Execution").log(err.message);
                        });
                        collection = db.collection("User");
                        collection.updateOne({ "username": membri[0] }, { "$push": { "team": name } }, function (err, data) {
                            if (err)
                                res.status(500).send("Internal Error in Query Execution").log(err.message);
                            else
                                res.send({ "ris": "ok" });
                        })
                    }
                    else {
                        res.send({ "ris": "nok" });
                        client.close();
                    }

                }
            });
        }
    });
});

app.get("/api/richiediRoom", function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Utenti");
            collection.find({ "username": currentUser }).project({ "rooms.name": 1, "username": 1 }).toArray(function (err, data) {
                if (err)
                    res.status(503).send("Errore di connessione al database durante l'esecuzione della query");
                else {
                    let names = [];
                    let user = data[0]["username"];
                    let rooms = data[0]["rooms"];
                    for (let i in rooms) {
                        let members = rooms[i]["name"].split('/');
                        if (members[0] == user)
                            names.push(members[1]);
                        else
                            names.push(members[0]);
                    }
                    collection.find({ "username": { "$in": names } }).project({ "fotoProfilo": 1, "totCoinProfilo": 1, "username": 1 }).toArray(function (err, data) {
                        if (err)
                            res.status(503).send("Errore di connessione al database durante l'esecuzione della query");
                        else {
                            res.send(data);
                        }
                    })
                }
            })
        }
    });
});

app.post('/api/caricaMex', function (req, res, next) {
    let room = req.body.room;
    let idChat = room.slice(1, room.length);
    let collec = "";
    switch (room[0]) {
        case "f":
            collec = "Giochi";
            break;
        case "t":
            collec = "Team";
            break;
        default:
            collec = "Tornei";
            break;
    }
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection(collec);
            if (isNaN(idChat)) {
                collection.find({ "nome": idChat }).project({ "messages": 1 }).toArray(function (err, data) {
                    if (err)
                        res.status(500).send("Internal Error in Query Execution");
                    else {
                        res.send(data[0]);
                    }
                })
            }
            else {
                collection.find({ "id": parseInt(idChat) }).project({ "messages": 1 }).toArray(function (err, data) {
                    if (err)
                        res.status(500).send("Internal Error in Query Execution");
                    else {
                        res.send(data[0]);
                    }
                })
            }
        }
    });
});

app.get('/api/findPhoto', function (req, res, next) {
    let id = req.query.idGame;
    id = parseInt(id);
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Giochi");
            collection.find({ "id": id }).project({ "imgPath": 1 }).toArray(function (err, data) {
                if (err)
                    res.status(err.code).send(err.message);
                else {
                    res.send(data);
                }
            })
        }
    });
});

app.get('/api/updateGamePhoto', function (req, res, next) {
    let id = req.query.idGame;
    let imgPath = req.query.photo;
    id = parseInt(id);
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Giochi");
            collection.updateOne({ "id": id }, { "$set": { "imgPath": imgPath } }, function (err, data) {
                if (err) {
                    res.status(err.code).send(err.message);
                }
                else {
                    res.send({ "ris": "ok" });
                }
            });
        }
    });
});

app.get('/api/GameNameById', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database");
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("Giochi");

            let id = req.query.id;
            collection.findOne({ "id": parseInt(id) }, function (err, data) {
                if (err) {
                    console.log("eccolo qui l'errore");
                    res.status(err.code).send(err.message);
                }
                else {
                    res.send(data);
                }
            });
        }
    });
});

app.post('/api/cambioPwd', function (req, res, next) {
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            res.status(503).send("Errore di connessione al database").log(err.message);
        else {
            const db = client.db(DBNAME);
            const collection = db.collection("User");

            let username = req.body.username;
            let oldPwd = req.body.oldPwd;
            let newPwd = req.body.newPwd;

            collection.findOne({ "username": username },
                function (err, data) {
                    if (err)
                        res.status(500).send("Internal Error in Query Execution").log(err.message);
                    else {
                        bcrypt.compare(oldPwd, data.password, function (err, ok) {
                            if (!ok)
                                res.send({ "ris": "nok" });
                            else {
                                collection.updateOne({ "username": username },
                                    { "$set": { "password": bcrypt.hashSync(newPwd, 10) } }, function () {
                                        if (err) {
                                            res.status(err.code).send(err.message);
                                        }
                                        else {
                                            res.send({ "ris": "ok" });
                                        }
                                    })
                            }
                        });
                    }
                });
        }
    });
});

app.get('/api/logout', function (req, res, next) {
    // viene creato un token vuoto che viene messo in un cookie scaduto
    res.set("Set-Cookie", `token="";max-age=-1;path=/;httponly=true`);
    res.send({ "ris": "ok" });
});

//#endregion

//#region API STEAM

//https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=
app.get("/api/getNewsGame", function (req, res, next) {
    let id = req.query.idGame;
    let count = req.query.count;
    request({
        "rejectUnauthorized": false,
        "url": "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=" + id + "&count=" + count.toString(),
        "method": "GET",
        "headers": {
            "X-API-VERSION": 1
        },
    }, function (error, response, body) {
        if (error) {
            console.log(error.code + " - " + error.message);
        }
        else {
            res.send(JSON.stringify(body));
        }
    });
});

app.get("/api/getGameDetails", function (req, res, next) {
    let id = req.query["idGame"];
    request("https://store.steampowered.com/api/appdetails?appids=" + id, function (error, response, body) {
        if (error) {
            console.log(error.message);
        }
        else {
            res.send(JSON.stringify(body));
        }
    });
});


//#endregion

//#region GESTIONE ERRORI

app.use("/", function (req, res, next) {
    res.status(404);
    if (req.originalUrl.startsWith("/api/")) {
        res.send("Risorsa non trovata");
    }
    else
        res.send(paginaErrore);
});

app.use(function (err, req, res, next) {
    if (!err.codice) {
        console.log(err.stack);
        res.codice = 500;
        res.message = "Internal Server Error";
    }
    res.status(res.codice);
    res.send(res.message);
})

//#endregion

//#region FUNCTION
function controllaToken(req, res, next) {
    let token = readCookie(req);
    if (token == "") {
        inviaErrore(req, res, 403, "Token mancante");
    }
    else {
        jwt.verify(token, privateKey, function (err, payload) {
            if (err) {
                inviaErrore(req, res, 403, "Token scaduto o corrotto");
            }
            else {
                let newToken = createToken(payload);
                writeCookie(res, newToken);
                currentUser = payload["username"];
                req.payload = payload;
                next();
            }
        });
    }
}

function inviaErrore(req, res, code, errorMessage) {
    res.status(code).send(errorMessage);
}

function readCookie(req) {
    let valoreCookie = "";
    if (req.headers.cookie) {
        let cookies = req.headers.cookie.split(';');
        for (let item of cookies) {
            item = item.split('=');
            if (item[0].includes("token")) {
                valoreCookie = item[1];
                break;
            }
        }
    }
    return valoreCookie;
}

//data --> record dell'utente
function createToken(data) {
    //sign() --> si aspetta come parametro un json con i parametri che si vogliono mettere nel token
    let json = {
        "_id": data["_id"],
        "username": data["username"],
        "iat": data["iat"] || Math.floor((Date.now() / 1000)),
        "exp": (Math.floor((Date.now() / 1000)) + TTL_Token)
    }
    let token = jwt.sign(json, privateKey);
    console.log(token);
    return token;

}

function writeCookie(res, token) {
    //set() --> metodo di express che consente di impostare una o più intestazioni nella risposta HTTP
    res.set("Set-Cookie", `token=${token};max-age=${TTL_Token};path=/;httponly=true`);
}
//#endregion

//#region CHAT

let users = [];
io.on('connection', function (socket) {
    let user = {}; // contiene le info dell'utente corrente
    mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
        if (err)
            socket.emit("Error", err.message);
        else {
            const db = client.db(DBNAME);
            let collection = db.collection("User");
            collection.find({ "username": currentUser }).project({ "preferenze": 1, "team": 1, "tournaments": 1 }).toArray(function (err, data) {
                if (err)
                    socket.emit("Error", err.message);
                else {
                    if (data.length > 0) {
                        for (let item of data[0]["preferenze"]) {
                            socket.join("f" + item);
                        }
                        for (let item of data[0]["team"]) {
                            socket.join("t" + item);
                        }
                    }
                }
            })
        }
        user.username = currentUser;
        user.socket = socket;
        let found = false;
        for (let i; i < users.length; i++) {
            if (users[i].username == user.username) {
                users.splice(i, 1, user);
                found = true;
            }
        }
        if (!found)
            users.push(user);
        socket.emit("myindex", users.length - 1);
        log(' User ' + colors.yellow(user.username) + ' (SocketID ' + colors.green(user.socket.id) + ')  connected!');

    });

    // 2) ricezione di un messaggio	 
    socket.on('message', function (data) {
        let msgRoom = data.split("#@//£");
        log('User ' + colors.yellow(users[msgRoom[2]].username) + "-" + colors.white(users[msgRoom[2]].socket.id) + ' sent ' + colors.green(msgRoom[0]));
        let date = new Date();
        let room = msgRoom[1];
        let updateId = msgRoom[1].slice(1, msgRoom[1].length);
        let collec;
        switch (room[0]) {
            case "f":
                collec = "Giochi";
                break;
            case "t":
                collec = "Team";
                break;
            default:
                collec = "Tornei";
                break;
        }
        let response = JSON.stringify({
            'from': users[msgRoom[2]].username,
            'message': msgRoom[0],
            'date': date,
            'roomID': msgRoom[1],
            'roomName': msgRoom[3],
        });
        mongoClient.connect(CONNECTIONSTRING, CONNECTIONOPTIONS, function (err, client) {
            if (err)
                res.status(503).send("Errore di connessione al database");
            else {
                const db = client.db(DBNAME);
                let collection = db.collection(collec);
                let message = {
                    "from": users[msgRoom[2]].username,
                    "message": msgRoom[0],
                    "date": date
                }
                if (isNaN(updateId)) {
                    collection.updateOne({ "nome": updateId }, { "$push": { "messages": message } }, function (err, res) {
                        if (err) {
                            console.log("errore");
                            socket.emit("Error", err.message);
                        }
                        else {
                            io.to(msgRoom[1]).emit('notify_message', response);
                        }
                    });
                }
                else {
                    collection.updateOne({ "id": parseInt(updateId) }, { "$push": { "messages": message } }, function (err, res) {
                        if (err) {
                            console.log("errore");
                            socket.emit("Error", err.message);
                        }
                        else {
                            io.to(msgRoom[1]).emit('notify_message', response);
                        }
                    });
                }
            }
        });
        // notifico a tutti i socket (compreso il mittente) il messaggio appena ricevuto 
        //io.sockets.emit('notify_message', response);
    });

});

// stampa i log con data e ora
function log(data) {
    console.log(colors.cyan("[" + new Date().toLocaleTimeString() + "]") + ": " + data);
}


//#endregion

