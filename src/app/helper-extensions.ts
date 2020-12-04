export function getPropertyValue(
  object: { [key: string]: any },
  propertyPath: string,
  defaultValue: any = false
) {
  return this.doesObjectContainProperty(object, propertyPath)
    ? object[propertyPath]
    : defaultValue;
}

export function doesObjectContainProperty<T>(object: T, propertyPath: string) {
  // If there's nothing to check
  if (typeof object !== 'object' || !object || !Object.keys(object).length) {
    return false;
  }

  // If there's nothing to check
  if (!propertyPath || !propertyPath.length) {
    return false;
  }

  try {
    // Iterate through propertyPath to dig into the object
    const finalValue = propertyPath.split('.').reduce((previous, current) => {
      // No hasOwnProperty check
      return typeof previous !== 'undefined' && previous !== null
        ? previous[current]
        : undefined;
    }, object);
    // We specifically want to check for undefined & null to check if value exist here
    return typeof finalValue !== 'undefined' && finalValue !== null;
  } catch (error) {
    // If the path has a wrong turn, the reduce function will throw an error
    return false;
  }
}
