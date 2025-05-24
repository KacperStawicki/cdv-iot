from typing import Type, Dict, Any, Callable
import inspect

class Container:
    def __init__(self):
        self._singletons: Dict[Type, Any] = {}
        self._factories: Dict[Type, Callable] = {}

    def register_singleton(self, cls: Type, instance: Any):
        self._singletons[cls] = instance

    def register_factory(self, cls: Type, factory: Callable):
        self._factories[cls] = factory

    def register(self, cls: Type):

        self._factories[cls] = lambda: self._create_instance(cls)

    def _create_instance(self, cls: Type):
        constructor = inspect.signature(cls.__init__)
        dependencies = []

        for name, param in list(constructor.parameters.items())[1:]:
            dependency_type = param.annotation
            if dependency_type is inspect.Parameter.empty:
                raise ValueError(f"Brakuje typu dla parametru '{name}' w {cls.__name__}")
            dependencies.append(self.resolve(dependency_type))
        return cls(*dependencies)

    def resolve(self, cls: Type):
        if cls in self._singletons:
            return self._singletons[cls]
        if cls in self._factories:
            return self._factories[cls]()
        raise ValueError(f"Typ {cls} nie jest zarejestrowany w kontenerze.")

# GLOBALNY kontener ustawień
container = Container()
