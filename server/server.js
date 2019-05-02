let express = require("express");
let graphqlHTTP = require("express-graphql");
let { buildSchema } = require("graphql");
let cors = require("cors");
let Pusher = require("pusher");
let bodyParser = require("body-parser");
let Multipart = require("connect-multiparty");

// Construct a schema, using GraphQL schema language
let schema = buildSchema(`
  type User {
    id : String!
    nickname : String!
    avatar : String!
  }

  type Post {
      id: String!
      user: User!
      caption : String!
      image : String!
  }

  type Query{
    user(id: String) : User!
    post(user_id: String, post_id: String) : Post!
    posts(user_id: String) : [Post]
  }
`);

// Maps id to User object
let userslist = {
  a: {
    id: "a",
    nickname: "Jariel Gojar",
    avatar: "https://scontent.fbom2-1.fna.fbcdn.net/v/t1.0-9/293863_293984350673213_1815846459_n.jpg?_nc_cat=102&_nc_ht=scontent.fbom2-1.fna&oh=3ccdce3b5ac0db1ac2637396387ebec5&oe=5D2C8927"
  },
  b: {
    id: "b",
    nickname: "JJG",
    avatar:"https://scontent.fbom2-1.fna.fbcdn.net/v/t1.0-9/293863_293984350673213_1815846459_n.jpg?_nc_cat=102&_nc_ht=scontent.fbom2-1.fna&oh=3ccdce3b5ac0db1ac2637396387ebec5&oe=5D2C8927"
  }
};

let postslist = {
  a: {
    a: {
      id: "a",
      user: userslist["a"],
      caption: "Speech at Sisters Wedding",
      image: "https://scontent.fbom2-1.fna.fbcdn.net/v/t1.0-9/293863_293984350673213_1815846459_n.jpg?_nc_cat=102&_nc_ht=scontent.fbom2-1.fna&oh=3ccdce3b5ac0db1ac2637396387ebec5&oe=5D2C8927"
    },
    b: {
      id: "b",
      user: userslist["a"],
      caption: "Kharghar Hill",
      image:
        "https://media-cdn.tripadvisor.com/media/photo-s/0e/2d/20/8c/just-10th-minute-from.jpg"
    }
  }
};


// The root provides a resolver function for each API endpoint
let root = {
  user: function({ id }) {
    return userslist[id];
  },
  post: function({ user_id, post_id }) {
    return postslist[user_id][post_id];
  },
  posts: function({ user_id }) {
    return Object.values(postslist[user_id]);
  }
};

// Configure Pusher client
let pusher = new Pusher({
  appId: "PUSHER_APP_ID",
  key: "PUSHER_APP_KEY",
  secret: "PUSHER_APP_SECRET",
  cluster: "PUSHER_APP_CLUSTER",
  encrypted: true
});

// create express app
let app = express();
app.use(cors());
app.use(bodyParser.json());

let multipartMiddleware = new Multipart();

app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true
  })
);

// trigger add a new post
app.post('/newpost', multipartMiddleware, (req,res) => {
  // create a sample post
  let post = {
    user : {
      nickname : req.body.name,
      avatar : req.body.avatar
    },
    image : req.body.image,
    caption : req.body.caption
  }

  // trigger pusher event
  pusher.trigger("posts-channel", "new-post", {
    post
  });

  return res.json({status : "Post created"});
});


app.listen(4000);
console.log("Running a GraphQL API server at localhost:4000/graphql");
