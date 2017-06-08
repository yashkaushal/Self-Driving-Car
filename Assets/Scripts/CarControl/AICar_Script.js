
import System;

// These variables allow the script to power the wheels of the car.
//var FrontLeftWheel : WheelCollider;
//var FrontRightWheel : WheelCollider;

// These variables are for the gears, the array is the list of ratios. The script
// uses the defined gear ratios to determine how much torque to apply to the wheels.
//var GearRatio : float[];
//var CurrentGear : int = 0; 

// These variables are just for applying torque to the wheels and shifting gears.
// using the defined Max and Min Engine RPM, the script can determine what gear the
// car needs to be in.
//var EngineTorque : float = 600.0;
//var MaxEngineRPM : float = 3000.0;
//var MinEngineRPM : float = 1000.0;
//private var EngineRPM : float = 0.0;

// These variables are three precious components for the car self-driving system:
private var brainComponent : Component; // Contains the neural network data structure
private var geneticComponent : Component; // Contains the genetic algorithm data structure
private var rayComponent : Component; // Contains the collection of rays casted from the car
public static var outputs: float[];
//public var tracks : GameObject[]; // keep tracks stored (for real time changing)

private var startPoint : GameObject; // This will store the startPoint of the active track

public var inputs : float[]; // Input vector, built every frame, that will be transmitted to the neural network
private var avgSpeed : float; // average driving speed
private var totDistance : float; // the distance made by the car
private var lastPosition : Vector3; // the position of the car in the current frame
private var totFrames : int; // frames passed from the simulation start (used for avgSpeed)
private var totSpeed : int; // (used for avgSpeed)

// learning mode : the NN uses the weights computed by the genetic algorithm each frame
// not-learning mode : weights are readed from an external file and remain static
private var isLearning : boolean;

private var randObj : System.Random;
function Start () {

	randObj = new System.Random();
	// Alter the center of mass to make the car more stable. I'ts less likely to flip this way.
//	GetComponent.<Rigidbody>().centerOfMass.y = -1.5;
	
	startPoint = GameObject.Find("StartPoint"); // get the startPoint of the active track
	
	// initialize all the main components
	
	brainComponent = GameObject.Find("Brain").GetComponent(NeuralNet_Script);
	brainComponent.brain = new NeuralNetwork(25, randObj); // Neurons in each hidden layer. A greater number means more flexibility on output values
	
	geneticComponent = GameObject.Find("Brain").GetComponent(GeneticAlgorithm_Script);
	// we create a population of 14 chromosomes, each one with the total number of weights of the neural network
	geneticComponent.population = new Population(10, brainComponent.brain.GetTotalWeights().length, randObj);
	
	rayComponent = GameObject.Find("RayTracing").GetComponent(RayCalc_Script);
	
	isLearning = true;

	startSimulation();

		

}

/*	This function starts a new simulation  */
function startSimulation()	{
	CancelInvoke("checkMoving");
	CancelInvoke("timeout");

	// put the car in the initial position
	transform.position = startPoint.transform.position;
	transform.rotation = startPoint.transform.rotation;
	GetComponent.<Rigidbody>().velocity = GetComponent.<Rigidbody>().angularVelocity = Vector3.zero;
	GameObject.Find("LapCollider").GetComponent(LapTime_Script).Start();
	
	if(isLearning)	{

		// set the NeuralNetwork weights by copying them from current chromosome
		brainComponent.brain.SetTotalWeights(
			geneticComponent.population.GetCurrentChromosome().GetWeights()
		);
	}
	
	// reset the fitness value and other status variables
	totFrames = 0;
	totSpeed = 0;
	avgSpeed = 0;
	totDistance = 0;
	lastPosition = transform.position;

	Invoke("timeout",220);
	Invoke("checkMoving", 5); // Check if the car is moving after the first 5 seconds
}

/* the fitness update can be a very basic increment, or a more advanced operation.
	for now we consider both actual distance and average speed, but in future there can be
	more checks, e.g. on curve type and distance to internal wall (this will probably make the 
	car drive "better", but will also increase the overall complexity of the neural network) */
function updateFitness () {	
	var currentFitness : int;
	
	currentFitness = Mathf.RoundToInt(totDistance * avgSpeed);
	geneticComponent.population.SetCurrentCromosomeFitness(currentFitness);
}

/* Every frame the neural network outputs its computed results to move the car */
function FixedUpdate () {
	// This is to limith the maximum speed of the car, adjusting the drag probably isn't the best way of doing it,
	// but it's easy, and it doesn't interfere with the physics processing.
//	GetComponent.<Rigidbody>().drag = GetComponent.<Rigidbody>().velocity.magnitude / 80;
	
	// Compute the engine RPM based on the average RPM of the two wheels, then call the shift gear function
//	EngineRPM = (FrontLeftWheel.rpm + FrontRightWheel.rpm)/2 * GearRatio[CurrentGear];
//	ShiftGears();
	
	rayComponent.CalcCollisions(); // force rays to calc all the collisions now
	
	// fill the input vector with the actual informations coming from the car's sensors
	inputs = new float[parseInt(NN_INPUT.COUNT)];
	inputs[parseInt(NN_INPUT.SPEED)] = Mathf.RoundToInt(GetComponent.<Rigidbody>().velocity.magnitude)+1; 
	inputs[parseInt(NN_INPUT.FRONT_COLLISION_DIST)] = rayComponent.frontCollisionDist;
	inputs[parseInt(NN_INPUT.LEFT_COLLISION_DIST)] = rayComponent.leftCollisionDist;
	inputs[parseInt(NN_INPUT.RIGHT_COLLISION_DIST)] = rayComponent.rightCollisionDist;
	inputs[parseInt(NN_INPUT.TURN_ANGLE)] = rayComponent.turnAngle;
	
	brainComponent.brain.SetInputs(inputs); // pass the inputs to the neural network
	brainComponent.brain.Update(); // brain start thinking....


	var a: UnityStandardAssets.Vehicles.Car.CarUserControl = GetComponent(UnityStandardAssets.Vehicles.Car.CarUserControl);

//				Debug.Log(a.name);
	a.outputs = brainComponent.brain.GetOutputs(); // ... and we have outputs!
	// set the acceleration factor (from 0.0 to 1.0)
	//FrontLeftWheel.motorTorque = FrontRightWheel.motorTorque = EngineTorque / GearRatio[CurrentGear] * outputs[parseInt(NN_OUTPUT.ACCELERATION)];
	// and steering (from -1.0 (left) to 1.0 (right)) - multiply it by 15 to make tighter turns
	// also, we do <force>*2-1 because the original value goes from 0.0 to 1.0
	//FrontLeftWheel.steerAngle = FrontRightWheel.steerAngle = 15 * (outputs[parseInt(NN_OUTPUT.STEERING_FORCE)]*2-1);

	// update distance made and avg speed
	totDistance += Vector3.Distance(transform.position, lastPosition); 
	lastPosition = transform.position;
	totSpeed += Mathf.RoundToInt(GetComponent.<Rigidbody>().velocity.magnitude);
	avgSpeed = totSpeed / ++totFrames;

	if (isLearning) {
		// update the fitness value
		updateFitness();
	}
}

/* Update function is used only to catch keyboard inputs */
function Update() {	

	// NOTE: save and restore functionalities are not available in Web Player
	#if !UNITY_WEBPLAYER
		if (Input.GetKeyDown(KeyCode.S)) {
			geneticComponent.population.SaveBestChromosome();
		}
	
	if (Input.GetKeyDown(KeyCode.R)) {
		if (isLearning) {
			var restoredWeights : float[] = geneticComponent.population.RestoreBestChromosome();
			brainComponent.brain.SetTotalWeights(restoredWeights);
			isLearning = false;
		}
		else {
			isLearning = true;
		}
		startSimulation();
	}
	#endif
}



/*	This function checks if the car is moving with an acceptable avg speed.
	If not, this simulation restarts. We don't need slow cars! */
function checkMoving() {
	if (avgSpeed < 2) {
		restartSimulation();
	}
}

function timeout(){
	restartSimulation();
	Debug.Log("timeout");

}



/*	if the car collides (with a wall), we save the fitness of current chromosome 
	and restart the simulation */
function OnCollisionStay(collision : Collision) {
	// for now the fitness mode is always set to STRICT, that mean that the simulation restarts on EVERY KIND of 
	// collision. With a lazy mode, instead, we could ignore some "light" collisions and continue
	if (geneticComponent.ga_FitnessMode == parseInt(GA_FITNESS_MODE.STRICT)) {
		for (var contact : ContactPoint in collision.contacts) {
			if (contact.normal != Vector3.up && contact.normal != Vector3.up*(-1)) {
				restartSimulation();
				break;
			}
		}
	}
}

/*	reset simulation, but with new chromosomes */
function restartSimulation() {
	if (isLearning) {
		Debug.Log("Current chromosome: " + geneticComponent.population.GetCurrentChromosomeID() 
			+ " with fitness " + geneticComponent.population.GetCurrentCromosomeFitness());
		
		// go throught the next chromosome
		geneticComponent.population.SetNextChromosome();
		
		if(geneticComponent.population.IsLastChromosome())	{
			// tried all the chromosomes, start a new generation.
			Debug.Log("Generation tested, start new one");
			geneticComponent.population.NewGeneration();
		}
	}
	startSimulation();
}

/* Print some statistics during each run */
function OnGUI () {
	var style : GUIStyle = new GUIStyle();

	var boxWidth = 180;
	GUI.Box (Rect (Screen.width-boxWidth, 0, boxWidth,  210), "STATS");
	GUI.Label (Rect (Screen.width-boxWidth + 10, 80, boxWidth - 10, 20), "Speed : " + Mathf.RoundToInt(GetComponent.<Rigidbody>().velocity.magnitude));
	GUI.Label (Rect (Screen.width-boxWidth + 10, 100, boxWidth - 10, 20), "Avg.Speed : " + avgSpeed);
	GUI.Label (Rect (Screen.width-boxWidth + 10, 120, boxWidth - 10, 20), "Distance : " + totDistance);
	
	style.fontStyle = FontStyle.Bold;
	if (isLearning) {
		GUI.Label (Rect (Screen.width-boxWidth + 10, 160, boxWidth - 10, 20), "Best fitness: " + geneticComponent.population.bestChromosome.GetFitness());
		GUI.Label (Rect (Screen.width-boxWidth + 10, 180, boxWidth - 10, 20), "in generation: " + (geneticComponent.population.bestPopulation+1) + " of " + (geneticComponent.population.currentPopulation+1));
		
		style.normal.textColor = Color.red;
		GUI.Label (Rect (10, Screen.height - 30, boxWidth - 10, 20), "LEARNING MODE", style);
	}
	else {
		style.normal.textColor = Color.green;
		GUI.Label (Rect (10, Screen.height - 30, boxWidth - 10, 20), "SHOW MODE", style);
	}
}