# ClientMessage

    { type:ClientMessage, data:{clientToken, sessionID, data}}
    token thats for per connection, so if you disconnect you cant connect to session again because the session will not know who you are
    sessionID so Ithat we know where to route user
    data for any data that the user is sending

## SessionMessage

   { type:SessionMessage, data:{sessionID, clientToken, data}}
    exact same structure as ClientMessage just sent to the client mapped to specified sessionID

## Main needs to just handle routing from

    client to session 
    and 
    session to client
