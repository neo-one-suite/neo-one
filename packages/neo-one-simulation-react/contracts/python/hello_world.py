from boa.blockchain.vm.Neo.Action import RegisterAction
from boa.blockchain.vm.Neo.Runtime import Log, Notify

OnHello = RegisterAction('hello', 'name')

def Main(operation, args):
    """

    :param operation: str The name of the operation to perform
    :param args: list A list of arguments along with the operation
    :return:
        bytearray: The result of the operation
    """


    if operation != None:

        if operation == 'hello':
            arg = args[0]
            Log('Sending notification')
            OnHello(arg)
            return True

    return False
