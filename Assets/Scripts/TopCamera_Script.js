#pragma strict

private var higherView : boolean;

function Start () {
	higherView = false;
}

function Update () {
	
	if (Input.GetKeyDown (KeyCode.UpArrow)) {
		higherView = !higherView;
	}
	
	transform.position.x = GameObject.Find("Car").transform.position.x;	
	transform.position.z = GameObject.Find("Car").transform.position.z;
	
	if (higherView) transform.position.y = 150;
	else transform.position.y = 700;
}
