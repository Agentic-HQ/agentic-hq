please check the IOMarshaller - meant to be generic and for any types of marshalling.  Seems to be locked in to file related marshelling at the moment.  How about we create a new IOMarshaller interface with 
  a FileIOMarshaller concrete class. When you create a new instance it initialised with a GUID. When you call getMarshallingID it returns the full temp directory where the marshelling is stored (if it was a    
  DB it would return the unique ID of the data in the db - this should be added to the interface method comment for getMarshallingID).  Then the CommandBuilder interface changes to (command, marshallingID)

  