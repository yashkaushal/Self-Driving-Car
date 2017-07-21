# Self-Driving-Car
Autonomous car driven by neural networks and evolved with genetic programming

Sensing has been done by the use of Ray-Casting which provides the input as the collision distance in particular directions. These inputs are then fed to a neural network which gives the outputs to drive and steer the car, to train the network genetic programming approach has been taken which fuses multiple randomly generated neural networks in order of their performance to result in an better network(expectantly).

# Demo
To run the project download from [Releases](https://github.com/yashkaushal/Self-Driving-Car/releases)(for MacOS and Windows) or build from source, car trains automatically without any human input.

# Usage
Press 'S' to save best network of session into the system and 'R' to reload it.
place bestchr.txt [(from trained network in source)](https://github.com/yashkaushal/Self-Driving-Car/tree/master/trained%20network) in folder with binaries to use a pre trained model by using 'R' key during simulation.

# Credits
https://github.com/alessandrofrancesconi/carwin
http://colah.github.io/posts/2014-03-NN-Manifolds-Topology/
