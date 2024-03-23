/**
 * @interface ITrigger
 */
export default class ITrigger {

    isActive(triggerText, rollResult, hitEvaluationResults) {
        throw new Error("A subclass of ITrigger must implement the isActive method");
    }

    triggersOn() {
        throw new Error("A subclass of ITrigger must implement the triggersOn method");
    }

    doesntTriggerOn() {
        throw new Error("A subclass of ITrigger must implement the doesntTriggerOn method");
    }
}
