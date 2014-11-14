Deckard
=======

2014 game simulation files

_PURPOSE_: Client/Server game framework for offloading physics
calculations to a server leaving only the graphics to be rendered on
the client.

_OBJECTIVE_: The client should be able to render a 3D scene using
Three.js.  Some of the elements in the scene are dynamic and their
positions and orientations will periodically be updated by some
process being computed on the server.

_METHOD_: We are using node.js to manage the server, SockJS to handle
the socket communication, and ThreeJS to handle the 3D graphics
rendering on the client.

_PREREQUISITES_: You must install the [*node*](http://nodejs.org/)
framework to run this in client/server mode.

To run this example, first install dependencies:

>    npm install

And run a server:

>    node server.js


That will spawn an http server listening on port 8000 which will
serve both html (served from the current directory) and also SockJS
server.
