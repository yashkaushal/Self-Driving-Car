using System;
using UnityEngine;
using UnityStandardAssets.CrossPlatformInput;

namespace UnityStandardAssets.Vehicles.Car
{
    [RequireComponent(typeof (CarController))]
    public class CarUserControl : MonoBehaviour
    {
        private CarController m_Car; // the car controller we want to use
		public static float[] outputs;

        private void Awake()
        {
            // get the car controller
            m_Car = GetComponent<CarController>();
		//	GetComponent<
        }


        private void FixedUpdate()
        {
			//Debug.Log(outputs[1]*2-1);
            // pass the input to the car!
           // float h = CrossPlatformInputManager.GetAxis("Horizontal");
           // float v = CrossPlatformInputManager.GetAxis("Vertical");
#if !MOBILE_INPUT
/*			float handbrake = outputs[1];
			if (handbrake<.95f)
				handbrake = 0;
			else 
				handbrake = handbrake/10000;
*/			m_Car.Move(outputs[0]*2-1, outputs[1], outputs[1], 0f);
		//	Debug.Log(handbrake);
#else
            m_Car.Move(h, v, v, 0f);
#endif
        }
    }
}
