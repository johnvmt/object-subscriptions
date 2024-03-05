# object-subscriptions
Nested object with mutations and subscribers

# Examples

## Calculate and Subscribe

    import {NestedObjectWithSubscriptions} from "object-subscriptions";
    
    const obj = new NestedObjectWithSubscriptions();
    
    obj.set("aa.bb", 123);
    obj.set("cc.dd", 123);
    
    obj.calculate(["aa.bb", "cc.dd"], (a, b) => {
        return a + b;
    }, "ee.ff")
    
    obj.subscribe("ee.ff", (value) => {
        console.log("VAL!", value);
    });

## Custom Separator and Traversal

    import {NestedObjectWithSubscriptions} from "object-subscriptions";

    const obj = new NestedObjectWithSubscriptions({}, {separator: '/'});

    obj.set("aa/bb", 123);
    obj.set("cc/dd", 123);
    
    obj.calculate(["aa/bb", "cc/dd"], (a, b) => {
        return a + b;
    }, "ee/ff")
    
    obj.subscribe("ee/ff", (value) => {
        console.log("VAL!", value);
    });
    
    
    for(let [pathParts, value] of obj.entries({pathParts: true})) {
        console.log(pathParts, value);
    }


## Take a slice

    import {NestedObjectWithSubscriptions} from "object-subscriptions";

    const obj = new NestedObjectWithSubscriptions({}, {separator: '/'});

    obj.set("aa/bb", 123);
    
    const child = obj.child("aa");
    
    console.log("VAL!", child.get([]));