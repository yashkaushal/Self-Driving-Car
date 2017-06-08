
var nearWaterObject : GameObject = null;
var farWaterObject : GameObject = null;

var near : boolean;

function Awake() 
{
	UpdateVisibility();
}

function OnTriggerEnter()
{
	near = true;
	UpdateVisibility();
}

function OnTriggerExit()
{
	near = false;
	UpdateVisibility();
}

function UpdateVisibility()
{
	nearWaterObject.GetComponent.<Renderer>().enabled = near;
	farWaterObject.GetComponent.<Renderer>().enabled = !near;
}
	
	
